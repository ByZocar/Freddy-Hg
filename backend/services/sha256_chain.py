"""Cadena de custodia digital con SHA-256.

Cada alerta genera un hash reproducible por terceros (Fiscalía, jueces,
revisores académicos) sobre los datos canónicos: escena Sentinel-1, fecha UTC,
coordenadas redondeadas, algoritmo, colección. Este hash cumple el requisito
NF-12 (admisibilidad de evidencia digital bajo Ley 1333/2009).
"""
from __future__ import annotations

import hashlib
import json
from typing import Any


ALGORITHM_VERSION = "freddy-hg-v1.0"
COLLECTION = "COPERNICUS/S1_GRD"


def compute_evidence_hash(
    alert_data: dict[str, Any],
    scene_id: str,
    scene_date_utc: str,
) -> str:
    """Computa el SHA-256 canónico de una alerta.

    Args:
        alert_data: dict con al menos `centroid_lat` y `centroid_lon`.
        scene_id: ID de la escena Sentinel-1 fuente.
        scene_date_utc: ISO-8601 UTC con sufijo Z.

    Returns:
        hex string de 64 caracteres (SHA-256).
    """
    canonical = {
        "scene_id": scene_id,
        "scene_date_utc": scene_date_utc,
        "centroid_lat": round(float(alert_data["centroid_lat"]), 6),
        "centroid_lon": round(float(alert_data["centroid_lon"]), 6),
        "detection_source": "Sentinel-1 SAR GRD",
        "algorithm": ALGORITHM_VERSION,
        "collection": COLLECTION,
    }
    payload = json.dumps(canonical, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def hash_phone(phone: str) -> str:
    """Hash SHA-256 de un número de teléfono (consistente con el SQL hash_phone)."""
    # Normalizar: sólo dígitos y `+`
    normalized = "".join(c for c in phone if c.isdigit() or c == "+")
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
