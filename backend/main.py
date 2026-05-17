"""Punto de entrada del backend Freddy Hg (FastAPI)."""
from __future__ import annotations

import base64
import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import alerts, export, ingest, organizations, pipeline, states


def _materialize_gee_key() -> None:
    """Si GEE_SERVICE_ACCOUNT_JSON_B64 esta en env, escribe el JSON a disco.

    Util en entornos como Railway donde no se pueden montar archivos de
    secretos de manera directa: el JSON se pasa como env var base64.
    """
    b64 = os.environ.get("GEE_SERVICE_ACCOUNT_JSON_B64")
    if not b64:
        return
    out = Path(settings.GEE_SERVICE_ACCOUNT_KEY_PATH)
    if out.exists():
        return
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(base64.b64decode(b64))
    logging.getLogger(__name__).info("GEE key materialized at %s", out)


_materialize_gee_key()


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = FastAPI(
    title="Freddy Hg API",
    description=(
        "Sistema de alerta temprana satelital para mineria ilegal "
        "en la Amazonia colombiana."
    ),
    version="1.0.0",
)

# CORS — admite el frontend local (Vite) y los dominios de produccion.
allowed_origins = list(
    {
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://app.freddyhg.org",
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api", tags=["ingest"])
app.include_router(alerts.router, prefix="/api", tags=["alerts"])
app.include_router(export.router, prefix="/api", tags=["export"])
app.include_router(organizations.router, prefix="/api", tags=["organizations"])
app.include_router(states.router, prefix="/api", tags=["states"])
app.include_router(pipeline.router, prefix="/api", tags=["pipeline"])


@app.get("/")
def root() -> dict:
    return {
        "service": "freddy-hg-backend",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": "freddy-hg-backend"}
