"""Geofencing contra ANM (concesiones mineras) y RAISG (resguardos indigenas).

Ambos usan archivos GeoJSON locales en `backend/data/` para deterministica y
rapidez. La verificacion contra la API publica de datos.gov.co es opcional y
sirve solo como cross-check secundario (la API si2v-pbq5 no tiene geom field).
"""
from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from shapely.geometry import Point, shape


logger = logging.getLogger(__name__)


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
RAISG_PATH = DATA_DIR / "raisg_resguardos_colombia.geojson"
ANM_PATH = DATA_DIR / "anm_concessions_colombia.geojson"


@lru_cache(maxsize=1)
def _load_geojson(path: Path) -> Optional[dict[str, Any]]:
    if not path.exists():
        logger.warning("GeoJSON no encontrado: %s", path)
        return None
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _point_in_features(lat: float, lon: float, geojson: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if geojson is None:
        return None
    point = Point(lon, lat)
    for feature in geojson.get("features", []):
        try:
            geom = shape(feature["geometry"])
        except Exception:
            continue
        if geom.contains(point):
            return feature.get("properties", {})
    return None


async def check_concession_status(lat: float, lon: float, radius_m: int = 500) -> dict[str, Any]:
    """Verifica si el punto esta dentro de una concesion minera ANM activa.

    Devuelve dict con:
        legal_status: 'concesion_activa' | 'ilegal_presunto' | 'verificar'
        concession_id: string o None
    """
    concessions = _load_geojson(ANM_PATH)
    match = _point_in_features(lat, lon, concessions)
    if match:
        estado = (match.get("estado_titulo") or "").lower()
        if "vigente" in estado or "activa" in estado:
            return {
                "legal_status": "concesion_activa",
                "concession_id": match.get("id_titulo") or match.get("codigo_expediente"),
            }
    # Sin coincidencia con titulo vigente → presunta ilegalidad
    return {"legal_status": "ilegal_presunto", "concession_id": None}


def check_indigenous_territory(lat: float, lon: float) -> dict[str, Any]:
    """Determina si el punto esta dentro de un resguardo indigena (RAISG)."""
    raisg = _load_geojson(RAISG_PATH)
    match = _point_in_features(lat, lon, raisg)
    if match:
        return {
            "indigenous_territory": match.get("nombre") or match.get("name"),
            "indigenous_nation": match.get("pueblo") or match.get("etnia"),
            "requires_ddhh_protocol": True,
        }
    return {
        "indigenous_territory": None,
        "indigenous_nation": None,
        "requires_ddhh_protocol": False,
    }
