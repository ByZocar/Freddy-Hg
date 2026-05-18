"""Servicio de email para notificaciones al funcionario CAR (F-11).

Usa Resend (https://resend.com) — API HTTP transaccional.
Razón del cambio vs. SMTP directo: Railway, Vercel, Heroku y otros PaaS
bloquean el puerto 587 saliente para prevenir spam, así que `smtplib`
falla con "Network is unreachable". Resend usa solo HTTPS estándar.

Configuración via variables de entorno:
    RESEND_API_KEY    - API key de resend.com (empieza con "re_")
    ALERT_EMAIL_FROM  - remitente visible (default "Freddy Hg <onboarding@resend.dev>")
    ALERT_EMAIL_BCC   - copia oculta al equipo para monitoreo (opcional)

Para usar un dominio propio (ej: alertas@freddyhg.org), el dominio debe
estar verificado en resend.com → Domains. Por defecto usamos el dominio
sandbox de Resend que funciona sin verificación.

Sin RESEND_API_KEY, el servicio loguea el email y lo omite silenciosamente
(graceful degradation — el pipeline no falla si el email no está configurado).
"""
from __future__ import annotations

import logging
import os
from typing import Any

import requests

logger = logging.getLogger(__name__)

# ─── Config desde env ─────────────────────────────────────────────
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_API_URL = "https://api.resend.com/emails"
ALERT_EMAIL_FROM = os.environ.get(
    "ALERT_EMAIL_FROM",
    "Freddy Hg <onboarding@resend.dev>",  # dominio sandbox de Resend
)
ALERT_EMAIL_BCC = os.environ.get("ALERT_EMAIL_BCC", "")
ALERT_EMAIL_REPLY_TO = os.environ.get("ALERT_EMAIL_REPLY_TO", "")

# URL publica del logo (Vercel sirve los assets estaticos del frontend).
# Los clientes de email cargan imagenes via HTTPS sin problemas.
LOGO_URL = "https://freddy-hg.vercel.app/brand/freddy-hg-emblem.png"
LANDING_URL = "https://freddy-hg.vercel.app"


def _email_configured() -> bool:
    return bool(RESEND_API_KEY)


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

    logo_url = LOGO_URL
    landing_url = LANDING_URL

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

      <!-- HEADER con emblema 3D -->
      <tr>
        <td style="background:#241A0C;padding:18px 28px;border-bottom:0.5px solid rgba(200,134,10,0.15);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle" style="width:40px;">
                <a href="{landing_url}" style="text-decoration:none;">
                  <img src="{logo_url}" alt="" width="32" height="32" style="display:block;border:0;outline:none;">
                </a>
              </td>
              <td valign="middle" style="padding-left:12px;">
                <span style="font-family:'Barlow Condensed',Arial,sans-serif;font-weight:800;font-size:22px;color:#C8860A;text-transform:uppercase;letter-spacing:-0.01em;">FREDDY</span>
                <span style="font-family:'Barlow Condensed',Arial,sans-serif;font-weight:400;font-size:22px;color:#A0A0A0;letter-spacing:0.03em;">Hg</span>
              </td>
              <td valign="middle" align="right">
                <span style="font-family:monospace;font-size:10px;color:#6A5A40;text-transform:uppercase;letter-spacing:0.06em;">
                  Alerta Satelital
                </span>
              </td>
            </tr>
          </table>
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
        <td style="padding:20px 28px 8px;">
          <a href="{alert_url}"
             style="display:block;background:#C8860A;color:#1A1208;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:800;font-size:16px;text-transform:uppercase;letter-spacing:0.02em;text-decoration:none;padding:14px 24px;border-radius:8px;text-align:center;">
            Ver alerta en el dashboard →
          </a>
          <p style="font-family:'IBM Plex Sans',Arial,sans-serif;font-size:11px;color:#6A5A40;text-align:center;margin:14px 0 0;line-height:1.5;">
            Descarga el informe técnico PDF directamente desde el dashboard.<br>
            Incluye SHA-256 verificable para uso en proceso sancionatorio (Ley 1333/2009).
          </p>
        </td>
      </tr>

      <!-- METADATOS DE LA ALERTA -->
      <tr>
        <td style="padding:8px 28px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0C06;border-radius:6px;">
            <tr>
              <td style="padding:10px 14px;">
                <span style="font-family:monospace;font-size:10px;color:#6A5A40;text-transform:uppercase;letter-spacing:0.06em;">ID de alerta:</span>
                <span style="font-family:monospace;font-size:11px;color:#C8860A;">ALERT-{alert_id_short}</span>
                <span style="float:right;font-family:monospace;font-size:10px;color:#6A5A40;">Sentinel-1 SAR · GEE</span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 14px 10px;border-top:0.5px solid rgba(200,134,10,0.08);padding-top:8px;">
                <span style="font-family:monospace;font-size:10px;color:#6A5A40;text-transform:uppercase;letter-spacing:0.06em;">Verificación:</span>
                <span style="font-family:monospace;font-size:10px;color:#A89878;word-break:break-all;">{sha_short}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="padding:18px 28px 24px;background:#0F0C06;border-top:0.5px solid rgba(200,134,10,0.08);">
          <p style="font-family:'IBM Plex Sans',Arial,sans-serif;font-size:11px;color:#6A5A40;margin:0 0 8px;line-height:1.6;">
            <strong style="color:#A89878;">Freddy Hg</strong> es un sistema de alerta temprana satelital
            para detectar minería ilegal de oro y riesgo de contaminación por mercurio en la Amazonía colombiana.
            Datos satelitales provenientes de la misión <em>Sentinel-1</em> (ESA / Copernicus),
            cruzados con el catastro minero de la <em>Agencia Nacional de Minería</em> y los polígonos de
            <em>RAISG</em>. Enriquecimiento contextual por <em>Mistral AI</em>.
          </p>
          <p style="font-family:'IBM Plex Sans',Arial,sans-serif;font-size:10px;color:#6A5A40;margin:0;line-height:1.6;">
            Para responder o coordinar acciones, escribe directamente a este correo.<br>
            Código fuente abierto:
            <a href="https://github.com/ByZocar/Freddy-Hg" style="color:#A89878;text-decoration:underline;">github.com/ByZocar/Freddy-Hg</a>
            ·
            <a href="{landing_url}" style="color:#A89878;text-decoration:underline;">freddy-hg.vercel.app</a>
            ·
            Licencia Apache 2.0
          </p>
          <p style="font-family:'IBM Plex Sans',Arial,sans-serif;font-size:10px;color:#4A3C28;margin:10px 0 0;">
            Si recibiste este correo por error o no eres el destinatario previsto,
            por favor escribe al equipo y elimínalo.
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
    """Envía el email de alerta al funcionario CAR vía Resend HTTP API.

    Graceful degradation: si RESEND_API_KEY no está configurada, loguea
    y retorna sin error para no interrumpir el pipeline.

    Args:
        to_address: correo institucional del destinatario (contact_email de la org).
        alert: dict completo de la alerta.
        dashboard_url: URL del dashboard (frontend URL del producto).
    """
    if not _email_configured():
        logger.info(
            "RESEND_API_KEY not configured — skipping email to %s",
            to_address,
        )
        return {"sent": False, "reason": "resend_not_configured", "to": to_address}

    subject, body_html, body_text = build_alert_email(alert, dashboard_url)

    payload: dict[str, Any] = {
        "from": ALERT_EMAIL_FROM,
        "to": [to_address],
        "subject": subject,
        "html": body_html,
        "text": body_text,
        "tags": [
            {"name": "type", "value": "alert"},
            {"name": "confidence", "value": str(alert.get("confidence_level", 1))},
        ],
    }
    if ALERT_EMAIL_BCC:
        payload["bcc"] = [ALERT_EMAIL_BCC]
    if ALERT_EMAIL_REPLY_TO:
        payload["reply_to"] = [ALERT_EMAIL_REPLY_TO]

    try:
        resp = requests.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
    except requests.RequestException as exc:
        logger.error("Network error sending to %s: %s", to_address, exc)
        return {"sent": False, "error": f"{type(exc).__name__}: {exc}", "to": to_address}

    if resp.status_code == 200:
        data = resp.json()
        logger.info(
            "Email sent to %s (resend id=%s) — subject: %s",
            to_address, data.get("id"), subject,
        )
        return {
            "sent": True,
            "to": to_address,
            "subject": subject,
            "resend_id": data.get("id"),
        }

    # Resend devuelve detalles del error en JSON
    try:
        err = resp.json()
    except Exception:
        err = {"message": resp.text[:300]}
    logger.error(
        "Resend error for %s — HTTP %d: %s",
        to_address, resp.status_code, err,
    )
    return {
        "sent": False,
        "error": f"HTTP {resp.status_code}: {err.get('message') or err}",
        "to": to_address,
    }


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
