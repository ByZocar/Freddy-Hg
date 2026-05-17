"""Router de la mini-web del guardian indigena (publica, sin login).

Spec: FRONTEND_SPEC_COMPLETO.md Pantalla 7.

Sirve una pagina HTML estatica ultra-ligera (<10 KB sin la imagen del
mapa) que se abre desde el link enviado por WhatsApp.

Constraints:
  - Sin JS pesado: solo HTML + CSS inline
  - Sin imports de Google Fonts: fonts del sistema como fallback
  - Funciona en Android basico con 2G
  - Sin almacenar IP/UA del visitante
  - Diseno coherente con la marca (paleta dorado/plata, fondo Surface-0)
"""
from __future__ import annotations

import html
import logging
import math
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse

from ..database import supabase_client


logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Helpers de presentacion ──────────────────────────────────────


_LEVEL_META = {
    1: {
        "tone_color": "#C8860A",
        "tone_bg": "rgba(200, 134, 10, 0.20)",
        "tone_border": "#C8860A",
        "label": "Nivel 1 · Monitor",
        "headline": "ACTIVIDAD DETECTADA",
        "symbol": "&#9899;",  # bola
    },
    2: {
        "tone_color": "#F0A060",
        "tone_bg": "rgba(232, 120, 32, 0.20)",
        "tone_border": "#E87820",
        "label": "Nivel 2 · Advertencia",
        "headline": "ALERTA ELEVADA",
        "symbol": "&#9888;",  # warning
    },
    3: {
        "tone_color": "#F07050",
        "tone_bg": "rgba(212, 56, 10, 0.20)",
        "tone_border": "#D4380A",
        "label": "Nivel 3 · Critico",
        "headline": "ALERTA CRITICA",
        "symbol": "&#9888;",  # warning
    },
}


_LEGAL_LABEL = {
    "ilegal_presunto": ("FUERA DE CONCESION ACTIVA", "#F07050"),
    "concesion_activa": ("DENTRO DE CONCESION VIGENTE", "#60B880"),
    "verificar": ("ESTADO LEGAL POR VERIFICAR", "#F0A060"),
}


def _infer_river(lat: float, lon: float) -> str:
    if -1.5 <= lat <= 0.5 and -73.5 <= lon <= -71.5:
        return "Rio Apaporis" if lat < -0.5 else "Rio Caqueta"
    if 3.0 <= lat <= 4.5 and -68.5 <= lon <= -67.5:
        return "Rio Inirida"
    if 5.5 <= lat <= 7.5 and -77.5 <= lon <= -76.0:
        return "Rio Atrato"
    return "Cuenca Amazonica"


def _short_id(full_id: str) -> str:
    return full_id.split("-")[0][:8].upper() if full_id else "????????"


def _format_utc(iso: Optional[str]) -> str:
    if not iso:
        return "—"
    # ISO 8601 sin lib externa: "2026-05-15T10:23:47Z" -> "15 May 2026 · 10:23 UTC"
    try:
        date_part, time_part = iso[:10], iso[11:16]
        y, m, d = date_part.split("-")
        months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        return f"{int(d)} {months[int(m) - 1]} {y} · {time_part} UTC"
    except Exception:
        return iso


def _radial_symbol_svg() -> str:
    """Devuelve el SVG inline del simbolo radial de 16 brazos.

    Reimplementacion del generador de FreddyHg_BrandGuidelines_Frontend.md
    seccion 4.2 con tamano fijo 28px (compacto para el header).
    """
    size = 28
    cx = size / 2
    cy = size / 2
    inner_r = size * 0.13
    outer_r = size * 0.44
    curves = [3.2, -2.4, 3.6, -2.8, 2.8, -3.4, 3.0, -2.2,
              3.4, -2.6, 2.6, -3.2, 3.2, -2.8, 2.8, -3.0]
    paths = []
    for i in range(16):
        angle_deg = (i * 360 / 16) - 90
        angle = math.radians(angle_deg)
        perp = angle + math.pi / 2
        sx = cx + inner_r * math.cos(angle)
        sy = cy + inner_r * math.sin(angle)
        ex = cx + outer_r * math.cos(angle)
        ey = cy + outer_r * math.sin(angle)
        mid_r = (inner_r + outer_r) * 0.46
        mx = cx + mid_r * math.cos(angle)
        my = cy + mid_r * math.sin(angle)
        off = curves[i] * (size / 80)
        cxp = mx + off * math.cos(perp)
        cyp = my + off * math.sin(perp)
        is_gold = i % 2 == 0
        color = "#C8860A" if is_gold else "#A0A0A0"
        sw = (size / 80) * (2.0 if is_gold else 1.5)
        paths.append(
            f'<path d="M{sx:.1f},{sy:.1f} Q{cxp:.1f},{cyp:.1f} {ex:.1f},{ey:.1f}" '
            f'stroke="{color}" stroke-width="{sw:.2f}" fill="none" stroke-linecap="round"/>'
        )
    return (
        f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" '
        f'xmlns="http://www.w3.org/2000/svg" style="display:block">'
        + "".join(paths)
        + f'<circle cx="{cx}" cy="{cy}" r="{size * 0.05:.1f}" fill="#0A0804"/>'
        + "</svg>"
    )


# ─── Endpoint principal ──────────────────────────────────────────


@router.get("/a/{alert_id}", response_class=HTMLResponse, include_in_schema=False)
def guardian_alert_page(alert_id: str, lang: str = Query(default="es", regex="^(es|en)$")) -> HTMLResponse:
    """Sirve la mini-web HTML para el guardian indigena.

    El link enviado por WhatsApp tiene la forma:
        https://freddy-hg-backend-production.up.railway.app/a/{first_8_chars}
    Por eso el endpoint acepta tanto el UUID completo como un prefijo.
    """
    # Si llega solo el prefijo, hacemos lookup por LIKE
    alert: Optional[dict[str, Any]] = None
    try:
        if len(alert_id) >= 32:  # UUID completo
            resp = supabase_client.table("alerts").select("*").eq("id", alert_id).limit(1).execute()
        else:
            resp = (
                supabase_client.table("alerts")
                .select("*")
                .ilike("id", f"{alert_id.lower()}%")
                .limit(1)
                .execute()
            )
        if resp.data:
            alert = resp.data[0]
    except Exception:  # noqa: BLE001
        logger.exception("Failed to load alert for guardian page")

    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    return HTMLResponse(_render_html(alert))


def _render_html(alert: dict[str, Any]) -> str:
    level = int(alert.get("confidence_level") or 1)
    meta = _LEVEL_META.get(level, _LEVEL_META[1])
    river = _infer_river(alert["centroid_lat"], alert["centroid_lon"])
    legal_status_raw = alert.get("legal_status") or "verificar"
    legal_label, legal_color = _LEGAL_LABEL.get(legal_status_raw, ("ESTADO LEGAL DESCONOCIDO", "#A89878"))
    short_id = _short_id(alert.get("id", ""))
    coords = f"{alert['centroid_lat']:.4f}, {alert['centroid_lon']:.4f}"
    scene_date = _format_utc(alert.get("scene_date_utc"))
    sha256_short = (alert.get("sha256_evidence") or "")[:16]
    mistral_excerpt = (alert.get("mistral_context") or "").strip()
    if len(mistral_excerpt) > 220:
        mistral_excerpt = mistral_excerpt[:217].rstrip() + "..."

    indigenous = alert.get("indigenous_territory")
    indigenous_html = ""
    if indigenous:
        nation = alert.get("indigenous_nation") or ""
        full = f"{html.escape(indigenous)}{' · ' + html.escape(nation) if nation else ''}"
        indigenous_html = (
            '<div class="row" style="color:#F07050;font-weight:500;">'
            f'TERRITORIO INDIGENA: {full}'
            "</div>"
        )

    mistral_html = ""
    if mistral_excerpt:
        mistral_html = (
            '<p class="ctx">' + html.escape(mistral_excerpt) + "</p>"
        )

    symbol_svg = _radial_symbol_svg()

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1A1208">
<meta name="robots" content="noindex, nofollow">
<title>Alerta {short_id} · Freddy Hg</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{
    background: #1A1208;
    color: #F2EDD8;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                 "Helvetica Neue", Arial, sans-serif;
    font-size: 15px;
    line-height: 1.5;
    min-height: 100vh;
  }}
  .header {{
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; background: #241A0C;
    border-bottom: 0.5px solid rgba(200, 134, 10, 0.15);
  }}
  .brand {{
    font-weight: 800; font-size: 18px; color: #C8860A;
    letter-spacing: -0.01em; text-transform: uppercase;
  }}
  .brand-sub {{
    font-weight: 400; color: #A0A0A0; letter-spacing: 0.03em;
  }}
  main {{ padding: 12px; max-width: 460px; margin: 0 auto; }}

  .level-box {{
    padding: 16px 18px;
    border-radius: 10px;
    border: 2px solid {meta["tone_border"]};
    background: {meta["tone_bg"]};
    margin: 14px 0;
  }}
  .level-label {{
    font-family: 'Courier New', monospace;
    font-size: 11px; color: {meta["tone_color"]};
    text-transform: uppercase; letter-spacing: 0.08em;
    margin-bottom: 6px;
  }}
  .level-headline {{
    font-weight: 800; font-size: 26px;
    color: {meta["tone_color"]}; line-height: 1.05;
    text-transform: uppercase; letter-spacing: -0.01em;
  }}
  .level-river {{
    margin-top: 6px;
    color: #F2EDD8; font-size: 17px; font-weight: 500;
  }}

  .data-card {{
    background: #241A0C;
    border: 0.5px solid rgba(200, 134, 10, 0.15);
    border-radius: 10px;
    padding: 14px 16px;
    margin: 12px 0;
  }}
  .row {{
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 8px 0;
    border-bottom: 0.5px solid rgba(200, 134, 10, 0.08);
    font-size: 13px;
  }}
  .row:last-child {{ border-bottom: none; }}
  .row .label {{
    color: #A89878;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.05em;
    font-family: 'Courier New', monospace;
  }}
  .row .value {{
    color: #F2EDD8;
    font-family: 'Courier New', monospace;
    text-align: right;
  }}
  .row.gold .value {{ color: #C8860A; font-weight: 600; }}

  .ctx {{
    color: #A89878; font-style: italic;
    line-height: 1.5; padding: 0 4px;
    margin: 14px 0;
    font-size: 13.5px;
  }}

  .cta {{
    margin: 18px 0 8px;
    padding: 14px 16px;
    background: rgba(200, 134, 10, 0.10);
    border: 0.5px solid rgba(200, 134, 10, 0.40);
    border-radius: 10px;
    color: #E8A820;
    font-size: 13.5px;
    line-height: 1.5;
  }}
  .cta b {{ color: #F2EDD8; }}

  footer {{
    margin-top: 22px;
    padding: 14px 16px 28px;
    text-align: center;
    font-family: 'Courier New', monospace;
    font-size: 10.5px;
    color: #6A5A40;
    line-height: 1.6;
  }}
  footer a {{ color: #A89878; text-decoration: none; }}

  .badges {{
    display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;
  }}
  .badge {{
    display: inline-block;
    padding: 3px 9px;
    border-radius: 6px;
    font-size: 11px; font-weight: 600;
    font-family: 'Courier New', monospace;
    text-transform: uppercase; letter-spacing: 0.05em;
    background: rgba(200, 134, 10, 0.12);
    border: 0.5px solid rgba(200, 134, 10, 0.30);
    color: #C8860A;
  }}
  .badge--legal {{
    color: {legal_color};
    background: {legal_color}1A;
    border-color: {legal_color}55;
  }}
</style>
</head>
<body>
<header class="header">
  {symbol_svg}
  <div>
    <div class="brand">FREDDY <span class="brand-sub">Hg</span></div>
    <div style="font-size:10px;font-family:'Courier New',monospace;color:#6A5A40;text-transform:uppercase;letter-spacing:0.06em;">
      Alerta {short_id}
    </div>
  </div>
</header>

<main>
  <div class="level-box">
    <div class="level-label">{meta["label"]}</div>
    <div class="level-headline">{meta["symbol"]} {meta["headline"]}</div>
    <div class="level-river">{html.escape(river)}</div>
    <div class="badges">
      <span class="badge badge--legal">{legal_label}</span>
    </div>
  </div>

  <div class="data-card">
    <div class="row gold">
      <span class="label">Coordenadas</span>
      <span class="value">{coords}</span>
    </div>
    <div class="row">
      <span class="label">Detectado</span>
      <span class="value">{scene_date}</span>
    </div>
    <div class="row">
      <span class="label">Sensor</span>
      <span class="value">Sentinel-1 SAR</span>
    </div>
    <div class="row">
      <span class="label">Hash SHA-256</span>
      <span class="value">{sha256_short}...</span>
    </div>
  </div>

  {indigenous_html}

  {mistral_html}

  <div class="cta">
    <b>Si confirmas actividad,</b> reporta a tu organizacion paraguas
    (OPIAC, ACIYA o equivalente) y a la CAR competente.
    <b>No te acerques fisicamente</b> a zonas con presencia armada.
  </div>
</main>

<footer>
  Freddy Hg · Sistema de Alerta Satelital<br>
  Sentinel-1 SAR (ESA / Copernicus) · <a href="https://github.com/ByZocar/Freddy-Hg" target="_blank" rel="noopener">codigo abierto</a><br>
  Sin almacenamiento de tu numero ni de tu IP.
</footer>
</body>
</html>"""
