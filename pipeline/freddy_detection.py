"""Freddy Hg — Pipeline de deteccion SAR (Sentinel-1 GRD).

Detecta dragas auriferas fluviales en la Amazonia colombiana cruzando
imagenes Sentinel-1 contra una mascara de agua y un baseline historico.

Ejecutado por Make.com cada 6 dias OR localmente con `python freddy_detection.py`.
"""
from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests

try:
    import ee  # type: ignore
except ImportError:  # pragma: no cover
    ee = None  # type: ignore[assignment]

from config import (
    BACKEND_URL,
    BACKSCATTER_THRESHOLD,
    GEE_PROJECT_ID,
    GEE_SERVICE_ACCOUNT_EMAIL,
    GEE_SERVICE_ACCOUNT_KEY_PATH,
    MIN_PIXELS,
    PILOT_ROIS,
    SECRET_KEY,
    WATER_THRESHOLD,
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("freddy_detection")


def initialize_gee() -> None:
    """Inicializa Google Earth Engine con la service account."""
    if ee is None:
        raise RuntimeError(
            "earthengine-api no esta instalado. Ejecuta `pip install earthengine-api`."
        )
    key_path = Path(GEE_SERVICE_ACCOUNT_KEY_PATH)
    if not key_path.exists():
        raise FileNotFoundError(f"GEE service account key no encontrado: {key_path}")
    credentials = ee.ServiceAccountCredentials(
        GEE_SERVICE_ACCOUNT_EMAIL, str(key_path)
    )
    if GEE_PROJECT_ID:
        ee.Initialize(credentials, project=GEE_PROJECT_ID)
    else:
        ee.Initialize(credentials)
    logger.info("GEE inicializado como %s (project=%s)", GEE_SERVICE_ACCOUNT_EMAIL, GEE_PROJECT_ID or "default")


def _date_range(days_back: int = 14) -> tuple[str, str]:
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days_back)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


def detect_mining_activity(roi_bounds: dict[str, float], roi_name: str) -> list[dict[str, Any]]:
    """Detecta candidatos de mineria en la ROI.

    Returns:
        Lista de alertas (dicts) listas para enviar al backend.
    """
    roi = ee.Geometry.Rectangle(
        [roi_bounds["xmin"], roi_bounds["ymin"], roi_bounds["xmax"], roi_bounds["ymax"]]
    )
    start_date, end_date = _date_range(days_back=14)

    s1_current = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(roi)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
        .select("VV")
    )

    if s1_current.size().getInfo() == 0:
        logger.warning("[%s] Sin imagenes S1 entre %s y %s", roi_name, start_date, end_date)
        return []

    median_current = s1_current.median().rename("VV")

    # Baseline historico 2018-2019
    s1_baseline = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(roi)
        .filterDate("2018-01-01", "2019-12-31")
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
        .select("VV")
    )
    median_baseline = s1_baseline.median().rename("VV")

    water_mask = median_current.lt(WATER_THRESHOLD)
    bright = median_current.gt(BACKSCATTER_THRESHOLD)
    candidates = bright.And(water_mask)
    # Tamano minimo (~200 m²)
    min_size_mask = candidates.connectedPixelCount(MIN_PIXELS + 5).gte(MIN_PIXELS)
    candidates_filtered = candidates.And(min_size_mask).selfMask().rename("candidate")

    change = median_current.subtract(median_baseline)
    new_activity_mask = change.gt(5).And(water_mask)

    # Para que reduceToVectors pueda invocar Reducer.mean() necesita la banda VV
    # ademas del label. Combinamos: label = candidate, banda extra = VV original.
    labeled = candidates_filtered.addBands(median_current)

    try:
        vectors = labeled.reduceToVectors(
            geometry=roi,
            scale=10,
            geometryType="centroid",
            eightConnected=False,
            labelProperty="label",
            reducer=ee.Reducer.mean(),
            maxPixels=1e9,
            bestEffort=True,
        )
        features = vectors.getInfo().get("features", [])
    except Exception as exc:  # noqa: BLE001
        logger.error("[%s] reduceToVectors fallo: %s", roi_name, exc)
        return []

    latest = s1_current.sort("system:time_start", False).first()
    scene_id = latest.get("system:id").getInfo()
    scene_date_ms = latest.get("system:time_start").getInfo()
    scene_date = datetime.utcfromtimestamp(scene_date_ms / 1000).isoformat() + "Z"

    alerts: list[dict[str, Any]] = []
    for feat in features:
        coords = feat["geometry"]["coordinates"]
        lon, lat = float(coords[0]), float(coords[1])
        props = feat.get("properties", {})
        # `mean` se calcula sobre la banda VV (porque labeled tiene candidate+VV)
        vv_val = float(props.get("VV", BACKSCATTER_THRESHOLD))
        # Estimacion de area: 1 pixel por defecto (centroide); refinar luego
        pixel_count = MIN_PIXELS
        area_m2 = pixel_count * 100.0  # 10x10 m

        # Es actividad nueva (vs baseline 2018-2019)?
        try:
            point = ee.Geometry.Point(lon, lat)
            new_sample = new_activity_mask.sample(region=point, scale=10).first()
            is_new = bool(new_sample.get("VV").getInfo()) if new_sample else True
        except Exception:
            is_new = True

        alerts.append(
            {
                "scene_id": scene_id,
                "scene_date_utc": scene_date,
                "centroid_lat": lat,
                "centroid_lon": lon,
                "backscatter_vv": round(vv_val, 2),
                "area_m2": area_m2,
                "pixel_count": pixel_count,
                "is_new_activity": is_new,
            }
        )

    logger.info("[%s] %d candidatos", roi_name, len(alerts))
    return alerts


def send_to_backend(alert: dict[str, Any]) -> dict[str, Any]:
    """Envia una alerta al endpoint /api/ingest."""
    headers = {"Content-Type": "application/json"}
    if SECRET_KEY:
        headers["Authorization"] = f"Bearer {SECRET_KEY}"
    resp = requests.post(
        f"{BACKEND_URL.rstrip('/')}/api/ingest",
        json=alert,
        timeout=60,
        headers=headers,
    )
    resp.raise_for_status()
    return resp.json()


def run_pipeline() -> dict[str, Any]:
    """Ejecuta el pipeline completo sobre todas las ROIs piloto."""
    initialize_gee()

    total = 0
    results = []
    for name, bounds in PILOT_ROIS.items():
        logger.info("=== Procesando %s ===", name)
        try:
            alerts = detect_mining_activity(bounds, name)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Detection failed for %s", name)
            results.append({"roi": name, "status": "error", "error": str(exc)})
            continue
        for alert in alerts:
            try:
                r = send_to_backend(alert)
                results.append({"roi": name, "alert_id": r.get("alert_id"), "status": "sent"})
                total += 1
            except Exception as exc:  # noqa: BLE001
                logger.warning("Ingest failed: %s", exc)
                results.append({"roi": name, "status": "failed", "error": str(exc)})

    summary = {
        "total_alerts": total,
        "results": results,
        "ran_at": datetime.utcnow().isoformat() + "Z",
        "version": "freddy-hg-v1.0",
    }
    logger.info("=== Pipeline complete: %d alertas enviadas ===", total)

    # Log local en 06_pruebas/test_logs
    try:
        log_dir = Path(__file__).resolve().parent.parent / "06_pruebas" / "test_logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / f"{datetime.utcnow().strftime('%Y-%m-%d_%H%M%S')}_run.json"
        log_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
        logger.info("📝 Log guardado: %s", log_path)
    except Exception as exc:  # noqa: BLE001
        logger.warning("No se pudo escribir log local: %s", exc)

    return summary


if __name__ == "__main__":
    try:
        out = run_pipeline()
        print(json.dumps(out, indent=2, ensure_ascii=False))
        sys.exit(0)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Pipeline fatal error")
        print(json.dumps({"error": str(exc)}, ensure_ascii=False))
        sys.exit(1)
