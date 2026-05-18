"""Servicio de email para notificaciones al funcionario CAR (F-11).

Usa SMTP estándar (Python smtplib built-in, sin dependencias extra).
Compatible con Gmail, SendGrid, Resend, o cualquier proveedor SMTP.

Configuración via variables de entorno:
    SMTP_HOST      - servidor SMTP (ej: smtp.gmail.com)
    SMTP_PORT      - puerto (587 para TLS, 465 para SSL)
    SMTP_USER      - usuario / remitente
    SMTP_PASSWORD  - contraseña o app password
    ALERT_EMAIL_FROM  - dirección de remitente visible (ej: alertas@freddyhg.org)
    ALERT_EMAIL_BCC   - copia oculta al equipo para monitoreo (opcional)

Sin estas variables, el servicio loguea el email y lo omite silenciosamente
(graceful degradation — el pipeline no falla si el email no está configurado).
"""
from __future__ import annotations

import logging
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

logger = logging.getLogger(__name__)

# ─── Config desde env ─────────────────────────────────────────────
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
ALERT_EMAIL_FROM = os.environ.get("ALERT_EMAIL_FROM", SMTP_USER)
ALERT_EMAIL_BCC = os.environ.get("ALERT_EMAIL_BCC", "")


def _smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


# ─── Mapeadores de presentación ───────────────────────────────────

_LEVEL_LABEL = {1: "Monitor", 2: "Advertencia", 3: "Crítico"}
_LEVEL_COLOR = {1: "#C8860A", 2: "#E87820", 3: "#D4380A"}

_LEGAL_LABEL = {
    "ilegal_presunto":  "FUERA DE CONCESIÓN ACTIVA (presunto ilegal)",
    "concesion_activa": "DENTRO DE CONCESIÓN VIGENTE",
    "verificar":        "ESTADO LEGAL PENDIENTE DE VERIFICACIÓN",
}


def _river_name(lat: float, lon: float) -> str:
    if -1.5 <= lat <= 0.5 and -73.5 <= lon <= -71.5:
        return "Río Apaporis" if lat < -0.5 else "Río Caquetá"
    if 3.0 <= lat <= 4.5 and -68.5 <= lon <= -67.5:
        return "Río Inírida"
    if 5.5 <= lat <= 7.5 and -77.5 <= lon <= -76.0:
        return "Río Atrato"
    return "Cuenca Amazónica"


# ─── Construcción del email ────────────────────────────────────────

def build_alert_email(alert: dict[str, Any], dashboard_url: str) -> tuple[str, str, str]:
    """Devuelve (subject, body_html, body_text) para una alerta.

    Args:
        alert: dict completo de la alerta desde Supabase.
        dashboard_url: URL del dashboard del funcionario CAR.

    Returns:
        Tupla (asunto, HTML, texto plano).
    """
    level = int(alert.get("confidence_level") or 1)
    level_label = _LEVEL_LABEL.get(level, "Monitor")
    level_color = _LEVEL_COLOR.get(level, "#C8860A")
    river = _river_name(alert["centroid_lat"], alert["centroid_lon"])
    legal = _LEGAL_LABEL.get(alert.get("legal_status") or "verificar", "Por determinar")
    lat = f"{alert['centroid_lat']:.4f}"
    lon = f"{alert['centroid_lon']:.4f}"
    indigenous = alert.get("indigenous_territory") or "—"
    sha_short = (alert.get("sha256_evidence") or "")[:16] + "..."
    mistral = (alert.get("mistral_context") or "").strip()
    if len(mistral) > 300:
        mistral = mistral[:297].rstrip() + "..."

    impact = alert.get("impact_metrics") or {}
    hg_kg = impact.get("mercury_kg", "—")
    damage = impact.get("damage_usd", "—")
    people = impact.get("people_at_risk", "—")

    alert_id_short = (alert.get("id") or "")[:8].upper()
    alert_url = alert.get("alert_url") or dashboard_url
    scene_date = (alert.get("scene_date_utc") or "")[:19].replace("T", " ") + " UTC"

    # ─── Asunto ───────────────────────────────────────────────────
    subject = (
        f"[Freddy Hg] Alerta Nivel {level} — {river} — "
        f"{level_label} · ALERT-{alert_id_short}"
    )

    # ─── HTML ─────────────────────────────────────────────────────
    indigenous_block = ""
    if alert.get("indigenous_territory"):
        nation = alert.get("indigenous_nation") or ""
        full = f"{indigenous}{' · ' + nation if nation else ''}"
        indigenous_block = f"""
        <tr>
          <td style="background:#2A0808;border-left:3px solid #D4380A;padding:12px 16px;border-radius:0 6px 6px 0;margin-top:8px;">
            <strong style="color:#F07050;">⚠ TERRITORIO INDÍGENA:</strong>
            <span style="color:#F2EDD8;"> {full}</span><br>
            <span style="color:#A89878;font-size:12px;">Protocolo de derechos humanos activado (T-106/25)</span>
          </td>
        </tr>"""

    mistral_block = ""
    if mistral:
        mistral_block = f"""
        <tr><td style="padding:16px 0 8px;">
          <div style="font-size:11px;font-family:monospace;color:#6A5A40;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">
            ANÁLISIS DE CONTEXTO — Mistral AI
          </div>
          <div style="font-style:italic;color:#A89878;line-height:1.6;">
            {mistral}
          </div>
        </td></tr>"""

    body_html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>Alerta Freddy Hg — {river}</title>
</head>
<body style="margin:0;padding:0;background:#0F0C06;font-family:'IBM Plex Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0C06;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1A1208;border:0.5px solid rgba(200,134,10,0.20);border-radius:12px;overflow:hidden;">

      <!-- HEADER -->
      <tr>
        <td style="background:#241A0C;padding:20px 28px;border-bottom:0.5px solid rgba(200,134,10,0.15);">
          <span style="font-family:'Barlow Condensed',Arial,sans-serif;font-weight:800;font-size:24px;color:#C8860A;text-transform:uppercase;letter-spacing:-0.01em;">
            FREDDY
          </span>
          <span style="font-family:'Barlow Condensed',Arial,sans-serif;font-weight:400;font-size:24px;color:#A0A0A0;letter-spacing:0.03em;">
            Hg
          </span>
          <span style="float:right;font-family:monospace;font-size:11px;color:#6A5A40;padding-top:6px;">
            Sistema de Alerta Satelital
          </span>
        </td>
      </tr>

      <!-- NIVEL DE ALERTA -->
      <tr>
        <td style="padding:24px 28px 0;">
          <div style="background:rgba({','.join(str(int(level_color.lstrip('#')[i:i+2],16)) for i in (0,2,4))},0.15);border:1px solid {level_color};border-radius:8px;padding:16px 20px;">
            <div style="font-family:monospace;font-size:11px;color:{level_color};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">
              NIVEL {level} · {level_label.upper()}
            </div>
            <div style="font-family:'Barlow Condensed',Arial,sans-serif;font-weight:800;font-size:28px;color:{level_color};text-transform:uppercase;letter-spacing:-0.01em;line-height:1.1;">
              Nueva actividad detectada
            </div>
            <div style="font-size:16px;font-weight:500;color:#F2EDD8;margin-top:8px;">
              {river} · Amazonía colombiana
            </div>
          </div>
        </td>
      </tr>

      <!-- DATOS TÉCNICOS -->
      <tr>
        <td style="padding:20px 28px 0;">
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#0F0C06;border:0.5px solid rgba(200,134,10,0.12);border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:12px 16px;border-bottom:0.5px solid rgba(200,134,10,0.08);">
                <div style="font-family:monospace;font-size:10px;color:#6A5A40;text-transform:uppercase;letter-spacing:0.06em;">Coordenadas (WGS84)</div>
                <div style="font-family:monospace;font-size:14px;color:#C8860A;margin-top:3px;">{lat}°, {lon}°</div>
              </td>
              <td style="padding:12px 16px;border-bottom:0.5px solid rgba(200,134,10,0.08);">
                <div style="font-family:monospace;font-size:10px;color:#6A5A40;text-transform:uppercase;letter-spacing:0.06em;">Estado legal ANM</div>
                <div style="font-size:13px;color:#F2EDD8;margin-top:3px;">{legal}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 16px;border-bottom:0.5px solid rgba(200,134,10,0.08);">
                <div style="font-family:monospace;font-size:10px;color:#6A5A40;text-transform:uppercase;letter-spacing:0.06em;">Fecha escena Sentinel-1</div>
                <div style="font-family:monospace;font-size:13px;color:#A89878;margin-top:3px;">{scene_date}</div>
              </td>
              <td style="padding:12px 16px;border-bottom:0.5px solid rgba(200,134,10,0.08);">
                <div style="font-family:monospace;font-size:10px;color:#6A5A40;text-transform:uppercase;letter-spacing:0.06em;">Territorio indígena</div>
                <div style="font-size:13px;color:#F2EDD8;margin-top:3px;">{indigenous}</div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:12px 16px;">
                <div style="font-family:monospace;font-size:10px;color:#6A5A40;text-transform:uppercase;letter-spacing:0.06em;">SHA-256 (cadena de custodia)</div>
                <div style="font-family:monospace;font-size:12px;color:#C8860A;margin-top:3px;">{sha_short}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- TERRITORIO INDÍGENA (condicional) -->
      {indigenous_block}

      <!-- MÉTRICAS DE IMPACTO -->
      <tr>
        <td style="padding:16px 28px 0;">
          <div style="font-family:monospace;font-size:10px;color:#6A5A40;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">
            Impacto estimado (proxy — no usar como dato oficial)
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="33%" style="background:#0F0C06;border:0.5px solid rgba(200,134,10,0.10);border-radius:6px;padding:12px;text-align:center;">
                <div style="font-family:'Barlow Condensed',Arial,sans-serif;font-weight:800;font-size:22px;color:#F07050;">{hg_kg}</div>
                <div style="font-family:monospace;font-size:9px;color:#6A5A40;text-transform:uppercase;">kg Hg estimado</div>
              </td>
              <td width="33%" style="background:#0F0C06;border:0.5px solid rgba(200,134,10,0.10);border-radius:6px;padding:12px;text-align:center;margin:0 8px;">
                <div style="font-family:'Barlow Condensed',Arial,sans-serif;font-weight:800;font-size:22px;color:#C8860A;">US${damage}</div>
                <div style="font-family:monospace;font-size:9px;color:#6A5A40;text-transform:uppercase;">costo remediación</div>
              </td>
              <td width="33%" style="background:#0F0C06;border:0.5px solid rgba(200,134,10,0.10);border-radius:6px;padding:12px;text-align:center;">
                <div style="font-family:'Barlow Condensed',Arial,sans-serif;font-weight:800;font-size:22px;color:#C8860A;">{people}</div>
                <div style="font-family:monospace;font-size:9px;color:#6A5A40;text-transform:uppercase;">personas aguas abajo</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CONTEXTO MISTRAL -->
      {mistral_block}

      <!-- CTA -->
      <tr>
        <td style="padding:20px 28px 28px;">
          <a href="{alert_url}"
             style="display:block;background:#C8860A;color:#1A1208;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:800;font-size:16px;text-transform:uppercase;letter-spacing:0.02em;text-decoration:none;padding:14px 24px;border-radius:8px;text-align:center;">
            Ver alerta en el dashboard →
          </a>
          <p style="font-family:monospace;font-size:10px;color:#6A5A40;text-align:center;margin:12px 0 0;">
            ALERT-{alert_id_short} · Sentinel-1 SAR · SHA-256: {sha_short}
          </p>
          <p style="font-family:monospace;font-size:10px;color:#6A5A40;text-align:center;margin:8px 0 0;">
            Freddy Hg · freddy-hg.vercel.app ·
            <a href="https://github.com/ByZocar/Freddy-Hg" style="color:#6A5A40;">código abierto Apache 2.0</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""

    # ─── Texto plano (fallback) ────────────────────────────────────
    body_text = f"""
☿ FREDDY Hg — ALERTA NIVEL {level} ({level_label.upper()})
={'='*60}

RÍO / ZONA: {river}
NIVEL: {level}/3 · {level_label}
ESTADO LEGAL ANM: {legal}
COORDENADAS: {lat}°, {lon}°
FECHA ESCENA: {scene_date}
TERRITORIO INDÍGENA: {indigenous}

IMPACTO ESTIMADO (proxy):
  · Hg estimado: {hg_kg} kg
  · Costo remediación: US${damage}
  · Personas aguas abajo 50 km: {people}

SHA-256 cadena de custodia: {sha_short}

{('CONTEXTO: ' + mistral) if mistral else ''}

Ver en el dashboard: {alert_url}

—
Freddy Hg · Sistema de Alerta Temprana Satelital
freddy-hg.vercel.app · github.com/ByZocar/Freddy-Hg
Este mensaje es confidencial. Dirigido a funcionarios de CARs
y organizaciones piloto autorizadas.
""".strip()

    return subject, body_html, body_text


# ─── Envío ────────────────────────────────────────────────────────

def send_alert_email(
    to_address: str,
    alert: dict[str, Any],
    dashboard_url: str,
) -> dict[str, Any]:
    """Envía el email de alerta al funcionario CAR.

    Usa TLS (puerto 587) por defecto. Si SMTP_PORT=465 cambia a SSL.
    Graceful degradation: si SMTP no está configurado, loguea y retorna
    sin error para no interrumpir el pipeline.

    Args:
        to_address: correo institucional del destinatario (contact_email de la org).
        alert: dict completo de la alerta.
        dashboard_url: URL del dashboard (frontend URL del producto).
    """
    if not _smtp_configured():
        logger.info(
            "SMTP not configured — skipping email to %s (set SMTP_HOST, SMTP_USER, SMTP_PASSWORD)",
            to_address,
        )
        return {"sent": False, "reason": "smtp_not_configured", "to": to_address}

    subject, body_html, body_text = build_alert_email(alert, dashboard_url)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = ALERT_EMAIL_FROM or SMTP_USER
    msg["To"] = to_address
    if ALERT_EMAIL_BCC:
        msg["Bcc"] = ALERT_EMAIL_BCC

    msg.attach(MIMEText(body_text, "plain", "utf-8"))
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    recipients = [to_address]
    if ALERT_EMAIL_BCC:
        recipients.append(ALERT_EMAIL_BCC)

    try:
        if SMTP_PORT == 465:
            ctx = ssl.create_default_context()
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(ALERT_EMAIL_FROM or SMTP_USER, recipients, msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.ehlo()
                server.starttls(context=ssl.create_default_context())
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(ALERT_EMAIL_FROM or SMTP_USER, recipients, msg.as_string())

        logger.info("Email sent to %s — subject: %s", to_address, subject)
        return {"sent": True, "to": to_address, "subject": subject}

    except smtplib.SMTPException as exc:
        logger.error("SMTP error sending to %s: %s", to_address, exc)
        return {"sent": False, "error": str(exc), "to": to_address}


def notify_car_organizations(alert: dict[str, Any], dashboard_url: str) -> list[dict[str, Any]]:
    """Envía email a todos los contact_email de organizaciones tipo CAR.

    Consulta la tabla organizations, filtra las de tipo CAR que tienen
    contact_email configurado, y manda el email a cada una.
    Diseñado para llamarse como background task desde el ingest router.
    """
    from ..database import supabase_client  # import local para evitar circular

    results: list[dict[str, Any]] = []

    try:
        orgs = (
            supabase_client
            .table("organizations")
            .select("id, name, type, contact_email")
            .in_("type", ["CAR", "FISCALIA"])
            .not_.is_("contact_email", "null")
            .execute()
        ).data or []
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not fetch CAR organizations for email: %s", exc)
        return [{"sent": False, "error": str(exc)}]

    for org in orgs:
        email = org.get("contact_email", "").strip()
        if not email or "@" not in email:
            continue
        result = send_alert_email(email, alert, dashboard_url)
        result["organization"] = org.get("name")
        results.append(result)
        logger.info(
            "Email dispatch to %s (%s): %s",
            email, org.get("name"), "OK" if result.get("sent") else result.get("reason", "error"),
        )

    return results
