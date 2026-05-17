"""Tests del modulo de notificaciones."""
from backend.services.notifications import build_message


def test_message_under_160_chars():
    msg = build_message(
        river_name="Caqueta",
        confidence_level=3,
        lat=-1.234567,
        lon=-72.345678,
        alert_url="https://app.freddyhg.org/alert/abc123-def456",
    )
    assert len(msg) <= 160
    assert "ALERTA" in msg
    assert "Nivel 3" in msg


def test_message_truncates_long_url():
    long_url = "https://app.freddyhg.org/alert/" + "x" * 200
    msg = build_message("CaquetaMuyLargoMuyLargo", 3, -1.234567, -72.345678, long_url)
    assert len(msg) <= 160
