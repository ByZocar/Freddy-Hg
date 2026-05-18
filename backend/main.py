"""Punto de entrada del backend Freddy Hg (FastAPI)."""
from __future__ import annotations

import base64
import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import alerts, export, guardian, ingest, organizations, pipeline, states


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
# Mini-web del guardian indigena: HTML estatico sin prefijo /api
# (URL final: https://.../a/{alert_id_prefix} para que quepa en 160 chars de WhatsApp)
app.include_router(guardian.router, tags=["guardian"])


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


@app.post("/_debug/email-test", include_in_schema=False)
def debug_email_test(to: str, authorization: str | None = None):
    """Endpoint TEMPORAL para diagnosticar configuracion SMTP.
    Borrar despues del debugging del piloto.
    """
    from fastapi import HTTPException, Header  # noqa: F401
    import os
    smtp_status = {
        "SMTP_HOST": os.environ.get("SMTP_HOST", "<empty>"),
        "SMTP_PORT": os.environ.get("SMTP_PORT", "<empty>"),
        "SMTP_USER": os.environ.get("SMTP_USER", "<empty>")[:5] + "..." if os.environ.get("SMTP_USER") else "<empty>",
        "SMTP_PASSWORD_set": bool(os.environ.get("SMTP_PASSWORD")),
        "ALERT_EMAIL_FROM": os.environ.get("ALERT_EMAIL_FROM", "<empty>"),
    }
    from .services.email_service import send_alert_email
    fake_alert = {
        "id": "debug-test-0001",
        "centroid_lat": -0.1234,
        "centroid_lon": -72.4567,
        "confidence_level": 2,
        "legal_status": "ilegal_presunto",
        "indigenous_territory": None,
        "scene_date_utc": "2026-05-18T00:00:00Z",
        "sha256_evidence": "debugtest0000000000000000000000000000000000000000000000000000",
        "mistral_context": "Prueba de configuracion SMTP — si llega este email, el sistema funciona.",
        "impact_metrics": {"mercury_kg": 500, "damage_usd": 1500000, "people_at_risk": 300},
        "alert_url": f"{settings.FRONTEND_URL}/alert/debug-test",
    }
    result = send_alert_email(to, fake_alert, f"{settings.FRONTEND_URL}/dashboard")
    return {"smtp_config": smtp_status, "result": result}
