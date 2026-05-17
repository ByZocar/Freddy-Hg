"""Smoke tests del pipeline (no requieren GEE real)."""
from __future__ import annotations

import sys
from pathlib import Path


PIPELINE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PIPELINE_DIR))


def test_config_loads():
    """Sanity: el config carga y trae los ROIs piloto."""
    from config import PILOT_ROIS, BACKSCATTER_THRESHOLD, WATER_THRESHOLD, MIN_PIXELS

    assert "caqueta_apaporis" in PILOT_ROIS
    assert "inirida_guainia" in PILOT_ROIS
    assert BACKSCATTER_THRESHOLD == -10.0
    assert WATER_THRESHOLD == -15.0
    assert MIN_PIXELS == 2


def test_pilot_rois_have_valid_bounds():
    from config import PILOT_ROIS

    for name, b in PILOT_ROIS.items():
        assert b["xmin"] < b["xmax"], name
        assert b["ymin"] < b["ymax"], name
        # Bounds dentro de la Amazonia colombiana aproximada
        assert -80 <= b["xmin"] <= -65, name
        assert -5 <= b["ymin"] <= 10, name
