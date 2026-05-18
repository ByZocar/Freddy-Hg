"""Despacho de notificaciones WhatsApp/SMS via Twilio.

NF-02: mensaje ≤160 caracteres, sin app, sin registro.
F-19: formato fijo `[ALERTA] Río X · Nivel N · lat,lon · Ver: URL`.
F-21: nunca almacenar el número en logs.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

from ..config import settings
from ..database import supabase_client


logger = logging.getLogger(__name__)


def _get_twilio_client() -> Optional[Client]:
    if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN):
        return None
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def _shorten_url(url: str) -> str:
    """Acorta una URL para ahorrar caracteres en el SMS.

    Para el MVP devolvemos la URL tal cual. Cuando se contrate un servicio de
    short-url (Bitly o propio), se reemplaza esta función.
    """
    return url


def build_guardian_url(alert_id: str) -> str:
    """URL corta hacia la mini-web HTML para el guardian indigena.

    Apunta al backend (no al frontend) porque el HTML estatico vive ahi
    para minimizar bytes (NF-02: funciona con 2G).
    Usa los primeros 8 chars del UUID para ahorrar caracteres en WhatsApp.
    """
    short_id = (alert_id.split("-")[0][:8] if alert_id else "????????").lower()
    base = settings.BACKEND_URL.rstrip("/")
    return f"{base}/a/{short_id}"


def build_message(
    river_name: str,
    confidence_level: int,
    lat: float,
    lon: float,
    alert_url: str,
) -> str:
    """Construye el mensaje de ≤160 caracteres.

    Formato fijo (F-19/F-20):
        "[ALERTA] Rio <X> - Nivel <N> - <lat>,<lon> - Ver: <url>"
    """
    short_url = _shorten_url(alert_url)
    msg = (
        f"[ALERTA] Rio {river_name} - Nivel {confidence_level} - "
        f"{lat:.4f},{lon:.4f} - Ver: {short_url}"
    )
    if len(msg) > 160:
        # Truncar manteniendo prioridad: nivel + coords > rio_name
        # Reservamos al menos la URL completa para que el link funcione.
        excess = len(msg) - 160
        cut_river = max(0, len(river_name) - excess - 1)
        truncated_river = river_name[:cut_river] if cut_river > 0 else "—"
        msg = (
            f"[ALERTA] Rio {truncated_river} - Nivel {confidence_level} - "
            f"{lat:.4f},{lon:.4f} - Ver: {short_url}"
        )
        if len(msg) > 160:
            msg = msg[:159] + "."
    return msg


def _send_via_twilio(
    twilio: Client,
    to_number: str,
    body: str,
    use_whatsapp: bool = True,
) -> dict[str, Any]:
    """Envía un mensaje via WhatsApp (default) con fallback automático a SMS."""
    from_number = settings.TWILIO_WHATSAPP_NUMBER
    try:
        if use_whatsapp:
            message = twilio.messages.create(
                body=body,
                from_=f"whatsapp:{from_number}",
                to=f"whatsapp:{to_number}",
            )
            return {"sid": message.sid, "channel": "whatsapp", "status": "queued"}
        message = twilio.messages.create(body=body, from_=from_number, to=to_number)
        return {"sid": message.sid, "channel": "sms", "status": "queued"}
    except TwilioRestException as exc:
        logger.warning("Twilio WhatsApp failed: %s", exc)
        if use_whatsapp:
            return _send_via_twilio(twilio, to_number, body, use_whatsapp=False)
        raise


def dispatch_alert_notifications(alert_record: dict[str, Any]) -> dict[str, Any]:
    """Tarea de background: envía alertas a todos los canales configurados.

    Canales:
      1. Email al funcionario CAR (F-11) — vía SMTP si está configurado.
      2. WhatsApp/SMS al guardián indígena (F-18) — vía Twilio sandbox.
      3. Audit log en Supabase.

    Por simplicidad en el MVP usamos el TEST_WHATSAPP_NUMBER si está
    configurado. En producción la lógica recorre la tabla `recipients`
    filtrando por basin_ids relevantes.

    Notas:
        - No se logea el número en claro (solo SID de Twilio).
        - El cuerpo del mensaje sí se logea — no contiene PII más allá del
          enlace público a la alerta.
    """
    # ── Canal 1: Email al funcionario CAR (F-11) ──────────────────
    from .email_service import notify_car_organizations  # local para evitar circular
    dashboard_url = f"{settings.FRONTEND_URL}/dashboard"
    email_results = notify_car_organizations(alert_record, dashboard_url)
    email_sent = sum(1 for r in email_results if r.get("sent"))
    if email_sent:
        logger.info("Email dispatched to %d CAR organizations", email_sent)

    # ── Canal 2: WhatsApp/SMS al guardián (F-18) ──────────────────
    twilio = _get_twilio_client()
    if twilio is None:
        logger.info("Twilio not configured; skipping WhatsApp notifications")
        return {"sent": email_sent, "email_results": email_results}

    river_name = alert_record.get("river_name") or "Amazonas"
    # El link va siempre a la mini-web del guardian en el backend (HTML
    # estatico, 2G-friendly), NO al frontend completo de React.
    guardian_url = build_guardian_url(alert_record["id"])
    msg = build_message(
        river_name=river_name,
        confidence_level=alert_record.get("confidence_level", 1),
        lat=alert_record["centroid_lat"],
        lon=alert_record["centroid_lon"],
        alert_url=guardian_url,
    )

    sent: list[dict[str, Any]] = []

    # 1) Destinatario de prueba (humano)
    if settings.TEST_WHATSAPP_NUMBER:
        try:
            result = _send_via_twilio(twilio, settings.TEST_WHATSAPP_NUMBER, msg)
            sent.append(result)
        except TwilioRestException as exc:
            logger.error("Failed to notify TEST_WHATSAPP_NUMBER: %s", exc)

    # 2) Destinatarios reales (de la tabla recipients) — sólo si supera el umbral de su organización
    try:
        rec_resp = supabase_client.table("recipients").select(
            "id, organization_id, phone_secret_ref, basin_ids, active"
        ).eq("active", True).execute()
        # El número real se almacena en `phone_secret_ref` (apuntando a un secret externo).
        # Para el MVP, sólo logueamos cuántos receptores serían notificados.
        recipients = rec_resp.data or []
        logger.info(
            "Would dispatch to %d configured recipients (out of band secrets)",
            len(recipients),
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not query recipients: %s", exc)

    # Auditoría
    try:
        supabase_client.table("audit_log").insert(
            {
                "event_type": "notification_dispatched",
                "alert_id": alert_record["id"],
                "event_data": {"channel_count": len(sent)},
            }
        ).execute()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Audit log insert failed: %s", exc)

    return {
        "sent": len(sent) + email_sent,
        "whatsapp_results": sent,
        "email_results": email_results,
    }
