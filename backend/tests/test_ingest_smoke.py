"""Smoke test del calculo de confianza."""
from backend.routers.ingest import _compute_confidence


def test_confidence_level_3_when_indigenous():
    assert _compute_confidence("ilegal_presunto", requires_ddhh=True, is_new=True) == 3
    assert _compute_confidence("concesion_activa", requires_ddhh=True, is_new=False) == 3


def test_confidence_level_2_when_illegal():
    assert _compute_confidence("ilegal_presunto", requires_ddhh=False, is_new=False) == 2


def test_confidence_level_2_when_new_activity_only():
    assert _compute_confidence("concesion_activa", requires_ddhh=False, is_new=True) == 2


def test_confidence_level_1_baseline():
    assert _compute_confidence("concesion_activa", requires_ddhh=False, is_new=False) == 1
