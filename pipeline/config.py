"""Parametros del pipeline SAR de Freddy Hg.

Estos valores son fijos del producto (ver ROADMAP_MASTER.md → Datos Fijos).
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


# Cargar .env desde la raiz del repo
ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


# ─── Algoritmo SAR ────────────────────────────────────────────────
BACKSCATTER_THRESHOLD = -10.0  # dB — umbral para deteccion de objetos brillantes
WATER_THRESHOLD = -15.0  # dB — umbral de mascara de cuerpos de agua
MIN_PIXELS = 2  # pixeles contiguos minimos (~200 m² a resolucion 10 m)
DETECTION_VERSION = "freddy-hg-v1.0"

# ─── Backend / API ────────────────────────────────────────────────
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
SECRET_KEY = os.environ.get("SECRET_KEY", "")

# ─── GEE ──────────────────────────────────────────────────────────
GEE_SERVICE_ACCOUNT_EMAIL = os.environ.get("GEE_SERVICE_ACCOUNT_EMAIL", "")
GEE_PROJECT_ID = os.environ.get("GEE_PROJECT_ID", "")

# Path siempre absoluto, anclado a la raíz del repo (no al cwd)
_raw_key = os.environ.get("GEE_SERVICE_ACCOUNT_KEY_PATH", "secrets/gee-service-account.json")
_key = Path(_raw_key)
if not _key.is_absolute():
    _key = ROOT / _key.relative_to(_key.anchor) if _key.anchor else ROOT / _key
GEE_SERVICE_ACCOUNT_KEY_PATH = str(_key)

# ─── Zonas piloto (bounding boxes WGS84) ──────────────────────────
PILOT_ROIS: dict[str, dict[str, float]] = {
    "caqueta_apaporis": {
        "xmin": -73.5,
        "ymin": -1.5,
        "xmax": -71.5,
        "ymax": 0.5,
    },
    "inirida_guainia": {
        "xmin": -68.5,
        "ymin": 3.0,
        "xmax": -67.5,
        "ymax": 4.5,
    },
}
