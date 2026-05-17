"""Router de lectura de alertas: lista, detalle, filtros, exportaciones."""
from __future__ import annotations

import csv
import io
import json
import logging
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from ..database import get_anon_client, supabase_client


logger = logging.getLogger(__name__)
router = APIRouter()


def _serialize_alerts_to_geojson(rows: list[dict[str, Any]]) -> dict[str, Any]:
    features = []
    for r in rows:
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [r.get("centroid_lon"), r.get("centroid_lat")],
                },
                "properties": {k: v for k, v in r.items() if k not in {"centroid_geom"}},
            }
        )
    return {"type": "FeatureCollection", "features": features}


@router.get("/alerts")
def list_alerts(
    confidence_min: int = Query(default=1, ge=1, le=3),
    legal_status: Optional[str] = None,
    indigenous_only: bool = False,
    days: int = Query(default=180, ge=1, le=730),
    limit: int = Query(default=200, ge=1, le=1000),
) -> dict[str, Any]:
    """Lista alertas con filtros simples."""
    q = supabase_client.table("alerts").select("*").gte("confidence_level", confidence_min)
    if legal_status:
        q = q.eq("legal_status", legal_status)
    if indigenous_only:
        q = q.eq("requires_ddhh_protocol", True)
    q = q.order("created_at", desc=True).limit(limit)
    try:
        resp = q.execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("Alerts query failed")
        raise HTTPException(status_code=500, detail=f"Query failed: {exc}") from exc
    return {"count": len(resp.data or []), "alerts": resp.data or []}


@router.get("/alerts/{alert_id}")
def get_alert(alert_id: str) -> dict[str, Any]:
    """Detalle completo de una alerta."""
    try:
        resp = supabase_client.table("alerts").select("*").eq("id", alert_id).single().execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=404, detail=f"Alert not found: {exc}") from exc
    if not resp.data:
        raise HTTPException(status_code=404, detail="Alert not found")
    return resp.data


@router.get("/alerts/{alert_id}/history")
def alert_history(alert_id: str, radius_km: float = Query(default=2.0, ge=0.1, le=50.0)) -> dict[str, Any]:
    """Historial de alertas en un radio dado (default 2km) — US-12."""
    try:
        alert = supabase_client.table("alerts").select("*").eq("id", alert_id).single().execute().data
    except Exception:
        raise HTTPException(status_code=404, detail="Alert not found")
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # Bounding box aproximada (1 grado ≈ 111 km)
    delta = radius_km / 111.0
    lat0, lon0 = alert["centroid_lat"], alert["centroid_lon"]
    try:
        rows = (
            supabase_client.table("alerts")
            .select("id, scene_date_utc, centroid_lat, centroid_lon, confidence_level, legal_status")
            .gte("centroid_lat", lat0 - delta)
            .lte("centroid_lat", lat0 + delta)
            .gte("centroid_lon", lon0 - delta)
            .lte("centroid_lon", lon0 + delta)
            .neq("id", alert_id)
            .order("scene_date_utc", desc=True)
            .limit(50)
            .execute()
        ).data or []
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"History query failed: {exc}") from exc
    return {"count": len(rows), "alerts": rows}


@router.get("/alerts/export/geojson")
def export_geojson(
    confidence_min: int = Query(default=1, ge=1, le=3),
    days: int = Query(default=365, ge=1, le=1825),
) -> Response:
    """Exporta alertas filtradas como GeoJSON descargable (F-24)."""
    rows = (
        supabase_client.table("alerts")
        .select("*")
        .gte("confidence_level", confidence_min)
        .order("created_at", desc=True)
        .limit(5000)
        .execute()
    ).data or []
    geojson = _serialize_alerts_to_geojson(rows)
    body = json.dumps(geojson, ensure_ascii=False, default=str).encode("utf-8")
    filename = f"freddy-hg-alerts-{datetime.utcnow().strftime('%Y%m%d')}.geojson"
    return Response(
        content=body,
        media_type="application/geo+json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/alerts/export/csv")
def export_csv(confidence_min: int = Query(default=1, ge=1, le=3)) -> Response:
    """Exporta alertas como CSV descargable (F-24)."""
    rows = (
        supabase_client.table("alerts")
        .select("id, created_at, scene_date_utc, centroid_lat, centroid_lon, confidence_level, legal_status, indigenous_territory, indigenous_nation, area_m2, sha256_evidence")
        .gte("confidence_level", confidence_min)
        .order("created_at", desc=True)
        .limit(5000)
        .execute()
    ).data or []
    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    filename = f"freddy-hg-alerts-{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/public/alerts")
def list_public_alerts(limit: int = Query(default=200, ge=1, le=1000)) -> dict[str, Any]:
    """Endpoint publico (sin login) que sirve a la vista periodistica."""
    client = get_anon_client()
    try:
        resp = client.table("public_alerts").select("*").order("created_at", desc=True).limit(limit).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("Public alerts query failed")
        raise HTTPException(status_code=500, detail=f"Query failed: {exc}") from exc
    return {"count": len(resp.data or []), "alerts": resp.data or []}
