"""Router de exportacion de PDF de evidencia legal."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, Response

from ..database import supabase_client
from ..services.pdf_generator import generate_pdf_bytes, generate_pdf_html


logger = logging.getLogger(__name__)
router = APIRouter()


def _fetch_alert(alert_id: str) -> dict:
    try:
        row = supabase_client.table("alerts").select("*").eq("id", alert_id).single().execute().data
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=404, detail=f"Alert not found: {exc}") from exc
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    return row


@router.get("/export/pdf/{alert_id}")
def export_pdf(alert_id: str) -> Response:
    """Devuelve el PDF binario para la alerta."""
    alert = _fetch_alert(alert_id)
    try:
        pdf = generate_pdf_bytes(alert)
    except RuntimeError as exc:
        # WeasyPrint no disponible (entornos sin GTK) → devolver HTML como degradacion
        logger.warning("PDF degraded to HTML: %s", exc)
        return HTMLResponse(content=generate_pdf_html(alert))
    filename = f"freddy-hg-alerta-{alert_id[:8]}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/html/{alert_id}")
def export_html(alert_id: str) -> HTMLResponse:
    """Vista previa HTML del informe (para debugging y entornos sin WeasyPrint)."""
    alert = _fetch_alert(alert_id)
    return HTMLResponse(content=generate_pdf_html(alert))
