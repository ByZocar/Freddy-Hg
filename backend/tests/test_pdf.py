"""Tests del generador de PDF (verifica HTML, no requiere WeasyPrint)."""
from backend.services.pdf_generator import build_html


SAMPLE_ALERT = {
    "id": "11111111-2222-3333-4444-555555555555",
    "scene_id": "S1A_IW_GRDH_TEST",
    "scene_date_utc": "2026-05-10T10:15:01Z",
    "centroid_lat": -1.234567,
    "centroid_lon": -72.345678,
    "backscatter_vv": -8.5,
    "area_m2": 300.0,
    "pixel_count": 3,
    "confidence_level": 3,
    "legal_status": "ilegal_presunto",
    "concession_id": None,
    "indigenous_territory": "Resguardo Aduche",
    "indigenous_nation": "Uitoto",
    "requires_ddhh_protocol": True,
    "is_new_activity": True,
    "sha256_evidence": "a" * 64,
    "alert_url": "https://app.freddyhg.org/alert/11111111",
    "detection_source": "Sentinel-1 SAR GRD",
}


def test_html_includes_sha256():
    html = build_html(SAMPLE_ALERT)
    assert SAMPLE_ALERT["sha256_evidence"] in html


def test_html_includes_legal_section():
    html = build_html(SAMPLE_ALERT)
    assert "ilegal_presunto" in html
    assert "Resguardo Aduche" in html
    assert "Uitoto" in html


def test_html_includes_legal_citation():
    html = build_html(SAMPLE_ALERT)
    assert "Cita recomendada" in html
    assert "Apache 2.0" in html


def test_html_includes_mistral_when_present():
    alert = {**SAMPLE_ALERT, "mistral_context": "Contexto de prueba para Mistral."}
    html = build_html(alert)
    assert "Mistral AI" in html
    assert "Contexto de prueba" in html
