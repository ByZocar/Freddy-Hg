"""Geofencing contra ANM (concesiones mineras) y RAISG (resguardos indígenas).

ANM: API pública de datos.gov.co con filtros SoQL.
RAISG: archivo GeoJSON local descargado una sola vez (backend/data/raisg_resguardos_colombia.geojson).
"""
from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

import httpx
from shapely.geometry import Point, shape


logger = logging.getLogger(__name__)


ANM_API = "https://www.datos.gov.co/resource/si2v-pbq5.json"
RAISG_PATH = Path(__file__).resolve().parent.parent / "data" / "raisg_resguardos_colombia.geojson"


async def check_concession_status(lat: float, lon: float, radius_m: int = 500) -> dict[str, Any]:
    """Verifica si el punto está dentro de una concesión minera ANM activa.

    Devuelve:
        legal_status: 'concesion_activa' | 'ilegal_presunto' | 'verificar'
        concession_id: string o None
    """
    params = {
        "$where": f"within_circle(the_geom, {lat}, {lon}, {radius_m})",
        "$limit": 1,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(ANM_API, params=params)
            resp.raise_for_status()
            data = resp.json()
        if data:
            concession = data[0]
            estado = (concession.get("estado_titulo") or "").lower()
            if "vigente" in estado or "activa" in estado:
                return {
                    "legal_status": "concesion_activa",
                    "concession_id": concession.get("id_titulo") or concession.get("codigo_expediente"),
                }
        return {"legal_status": "ilegal_presunto", "concession_id": None}
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("ANM API unavailable: %s", exc)
        return {
            "legal_status": "verificar",
            "concession_id": None,
            "note": "ANM API unavailable; manual review required",
        }


@lru_cache(maxsize=1)
def _load_raisg() -> Optional[dict[str, Any]]:
    """Carga el GeoJSON RAISG en memoria (una vez por proceso)."""
    if not RAISG_PATH.exists():
        logger.warning(
            "RAISG GeoJSON not found at %s. Indigenous geofencing disabled.", RAISG_PATH
        )
        return None
    with RAISG_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def check_indigenous_territory(lat: float, lon: float) -> dict[str, Any]:
    """Determina si el punto está dentro de un resguardo indígena (RAISG)."""
    raisg = _load_raisg()
    point = Point(lon, lat)

    default = {
        "indigenous_territory": None,
        "indigenous_nation": None,
        "requires_ddhh_protocol": False,
    }
    if raisg is None:
        return default

    for feature in raisg.get("features", []):
        try:
            geom = shape(feature["geometry"])
        except Exception:
            continue
        if geom.contains(point):
            props = feature.get("properties", {})
            return {
                "indigenous_territory": props.get("nombre") or props.get("name"),
                "indigenous_nation": props.get("pueblo") or props.get("etnia"),
                "requires_ddhh_protocol": True,
            }
    return default
