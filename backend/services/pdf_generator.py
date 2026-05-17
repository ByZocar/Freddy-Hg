"""Generación de PDF de evidencia legal con WeasyPrint.

Cumple NF-12: cadena de custodia digital admisible bajo Ley 1333/2009 y CGP.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Optional

logger = logging.getLogger(__name__)


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Informe Tecnico de Alerta - Freddy Hg</title>
<style>
  @page {{ size: A4; margin: 1.5cm; }}
  body {{ font-family: 'Helvetica', sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.45; }}
  header {{ border-bottom: 3px solid #0f6b5f; padding-bottom: 12px; margin-bottom: 18px; }}
  header h1 {{ margin: 0; font-size: 20pt; color: #0f6b5f; }}
  header p {{ margin: 4px 0; color: #555; }}
  h2 {{ font-size: 13pt; color: #0f6b5f; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 22px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 8px; }}
  th, td {{ text-align: left; padding: 6px 8px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }}
  th {{ background: #f4f4f4; font-weight: 600; width: 38%; }}
  .hash {{ font-family: 'Courier New', monospace; font-size: 9pt; word-break: break-all; background: #f4f4f4; padding: 6px; border-radius: 3px; }}
  .footer {{ position: fixed; bottom: 0.5cm; left: 1.5cm; right: 1.5cm; font-size: 8pt; color: #777; border-top: 1px solid #ccc; padding-top: 6px; }}
  .warn {{ background: #fff8e1; border-left: 4px solid #f9a825; padding: 8px 12px; margin: 12px 0; }}
  .mistral {{ background: #f3e5f5; border-left: 4px solid #6a1b9a; padding: 10px 14px; margin: 12px 0; font-style: italic; }}
  .citation {{ background: #e8f5e9; border-left: 4px solid #2e7d32; padding: 10px 14px; margin: 14px 0; font-size: 10pt; }}
</style>
</head>
<body>
  <header>
    <h1>Informe Tecnico de Alerta Satelital</h1>
    <p><strong>Sistema:</strong> Freddy Hg - Sistema de alerta temprana de mineria ilegal</p>
    <p><strong>ID de alerta:</strong> {alert_id}</p>
    <p><strong>Generado:</strong> {generated_at}</p>
  </header>

  <h2>1. Origen de la deteccion</h2>
  <table>
    <tr><th>Sensor</th><td>{detection_source}</td></tr>
    <tr><th>ID de escena Sentinel-1</th><td>{scene_id}</td></tr>
    <tr><th>Fecha UTC de la escena</th><td>{scene_date_utc}</td></tr>
    <tr><th>Coleccion fuente</th><td>COPERNICUS/S1_GRD (ESA)</td></tr>
    <tr><th>Algoritmo</th><td>freddy-hg-v1.0 (Apache 2.0)</td></tr>
  </table>

  <h2>2. Localizacion geoespacial</h2>
  <table>
    <tr><th>Latitud (WGS84)</th><td>{lat:.6f}</td></tr>
    <tr><th>Longitud (WGS84)</th><td>{lon:.6f}</td></tr>
    <tr><th>Retrodispersion VV (dB)</th><td>{vv}</td></tr>
    <tr><th>Area estimada (m2)</th><td>{area_m2}</td></tr>
    <tr><th>Pixeles contiguos</th><td>{pixel_count}</td></tr>
  </table>

  <h2>3. Calificacion legal</h2>
  <table>
    <tr><th>Estado legal (ANM)</th><td>{legal_status}</td></tr>
    <tr><th>Concesion asociada</th><td>{concession_id}</td></tr>
    <tr><th>Territorio indigena (RAISG)</th><td>{indigenous_territory}</td></tr>
    <tr><th>Pueblo / Nacion</th><td>{indigenous_nation}</td></tr>
    <tr><th>Requiere protocolo DDHH</th><td>{requires_ddhh_protocol}</td></tr>
    <tr><th>Nivel de confianza</th><td>{confidence_level} / 3</td></tr>
    <tr><th>Actividad nueva vs. baseline 2018-2019</th><td>{is_new_activity}</td></tr>
  </table>

  {mistral_section}

  {metrics_section}

  <h2>{section_num_evidence}. Cadena de custodia digital</h2>
  <p>El siguiente hash SHA-256 es reproducible por cualquier tercero sobre los metadatos
  canonicos (escena, fecha UTC, coordenadas redondeadas a 6 decimales, algoritmo, coleccion).
  Cualquier alteracion del dato fuente genera un hash diferente.</p>
  <div class="hash">{sha256}</div>
  <p><strong>URL permanente:</strong> {alert_url}</p>

  <div class="warn">
    <strong>Limitaciones del modelo:</strong> El sensor Sentinel-1 SAR detecta objetos metalicos
    de retrodispersion alta sobre cuerpos de agua. Puede generar falsos positivos en
    presencia de embarcaciones legales, estructuras flotantes ajenas a mineria, o
    instalaciones temporales. Consulte la nota de precision en docs/accuracy.md.
  </div>

  <div class="citation">
    <strong>Cita recomendada:</strong><br>
    Freddy Hg ({year}). Alerta satelital {alert_id_short}. Sistema de monitoreo SAR de
    mineria ilegal en la Amazonia colombiana. URL: {alert_url}. SHA-256: {sha256_short}...
  </div>

  <div class="footer">
    Freddy Hg - Sistema de alerta temprana satelital de mineria ilegal - Amazonia colombiana<br>
    Codigo abierto bajo licencia Apache 2.0 - github.com/ByZocar/Freddy-Hg
  </div>
</body>
</html>"""


def _format_value(value: Any, default: str = "Sin dato") -> str:
    if value is None or value == "":
        return default
    return str(value)


def build_html(alert: dict[str, Any]) -> str:
    """Construye el HTML del informe a partir del dict de alerta."""
    alert_id = alert.get("id", "")
    sha256 = alert.get("sha256_evidence", "")

    mistral_section = ""
    if alert.get("mistral_context"):
        mistral_section = (
            "<h2>4. Analisis de contexto (Mistral AI)</h2>"
            f"<div class='mistral'>{alert['mistral_context']}</div>"
        )
        section_num_evidence = 6 if alert.get("impact_metrics") else 5
    else:
        section_num_evidence = 5 if alert.get("impact_metrics") else 4

    metrics_section = ""
    if alert.get("impact_metrics"):
        m = alert["impact_metrics"]
        metrics_section = (
            "<h2>5. Metricas de impacto estimado</h2>"
            "<table>"
            f"<tr><th>Mercurio estimado (kg/anno)</th><td>{_format_value(m.get('mercury_kg'))}</td></tr>"
            f"<tr><th>Dano economico estimado (USD)</th><td>{_format_value(m.get('damage_usd'))}</td></tr>"
            f"<tr><th>Personas en riesgo aguas abajo</th><td>{_format_value(m.get('people_at_risk'))}</td></tr>"
            "</table>"
        )

    return HTML_TEMPLATE.format(
        alert_id=alert_id,
        alert_id_short=alert_id[:8] if alert_id else "",
        generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        detection_source=_format_value(alert.get("detection_source"), "Sentinel-1 SAR"),
        scene_id=_format_value(alert.get("scene_id")),
        scene_date_utc=_format_value(alert.get("scene_date_utc")),
        lat=float(alert.get("centroid_lat", 0)),
        lon=float(alert.get("centroid_lon", 0)),
        vv=_format_value(alert.get("backscatter_vv")),
        area_m2=_format_value(alert.get("area_m2")),
        pixel_count=_format_value(alert.get("pixel_count")),
        legal_status=_format_value(alert.get("legal_status")),
        concession_id=_format_value(alert.get("concession_id")),
        indigenous_territory=_format_value(alert.get("indigenous_territory")),
        indigenous_nation=_format_value(alert.get("indigenous_nation")),
        requires_ddhh_protocol="Si" if alert.get("requires_ddhh_protocol") else "No",
        confidence_level=_format_value(alert.get("confidence_level")),
        is_new_activity="Si" if alert.get("is_new_activity") else "No",
        sha256=sha256,
        sha256_short=sha256[:16] if sha256 else "",
        alert_url=_format_value(alert.get("alert_url")),
        year=datetime.utcnow().year,
        mistral_section=mistral_section,
        metrics_section=metrics_section,
        section_num_evidence=section_num_evidence,
    )


def generate_pdf_bytes(alert: dict[str, Any]) -> bytes:
    """Genera el PDF como bytes. Usa WeasyPrint."""
    # Import perezoso para que el resto del backend funcione si WeasyPrint
    # no se puede inicializar en el entorno (faltan libs nativas en Win).
    try:
        from weasyprint import HTML  # type: ignore
    except (ImportError, OSError) as exc:
        logger.error("WeasyPrint unavailable: %s", exc)
        raise RuntimeError(
            "WeasyPrint no esta disponible. Instale GTK3 en Windows o use Linux/Mac."
        ) from exc

    html = build_html(alert)
    return HTML(string=html).write_pdf()


def generate_pdf_html(alert: dict[str, Any]) -> str:
    """Fallback HTML para entornos donde WeasyPrint falla (sirve como vista previa)."""
    return build_html(alert)
