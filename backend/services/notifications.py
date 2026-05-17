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


def build_message(
    river_name: str,
    confidence_level: int,
    lat: float,
    lon: float,
    alert_url: str,
) -> str:
    """Construye el mensaje de ≤160 caracteres."""
    short_url = _shorten_url(alert_url)
    msg = (
        f"[ALERTA] Rio {river_name} - Nivel {confidence_level} - "
        f"{lat:.4f},{lon:.4f} - Ver: {short_url}"
    )
    if len(msg) > 160:
        # Truncar la URL al final si es necesario
        budget = 160 - len(msg) + len(short_url)
        msg = msg[: 160 - 1] + "."
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
    """Tarea de background: envía alertas a los destinatarios afectados.

    Por simplicidad en el MVP usamos el TEST_WHATSAPP_NUMBER si está
    configurado. En producción la lógica recorre la tabla `recipients`
    filtrando por basin_ids relevantes.

    Notas:
        - No se logea el número en claro (solo SID de Twilio).
        - El cuerpo del mensaje sí se logea — no contiene PII más allá del
          enlace público a la alerta.
    """
    twilio = _get_twilio_client()
    if twilio is None:
        logger.info("Twilio not configured; skipping notifications")
        return {"sent": 0, "skipped": True}

    river_name = alert_record.get("river_name") or "Amazonas"
    msg = build_message(
        river_name=river_name,
        confidence_level=alert_record.get("confidence_level", 1),
        lat=alert_record["centroid_lat"],
        lon=alert_record["centroid_lon"],
        alert_url=alert_record.get("alert_url", "https://app.freddyhg.org"),
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

    return {"sent": len(sent), "results": sent}
