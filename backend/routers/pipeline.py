"""Endpoint que dispara el pipeline GEE (llamado por Make.com)."""
from __future__ import annotations

import logging
import subprocess
import sys
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException

from ..config import settings


logger = logging.getLogger(__name__)
router = APIRouter()


PIPELINE_SCRIPT = Path(__file__).resolve().parent.parent.parent / "pipeline" / "freddy_detection.py"


@router.post("/run-pipeline")
def run_pipeline(authorization: str | None = Header(default=None)) -> dict:
    """Ejecuta el pipeline freddy_detection.py en un subproceso.

    Make.com lo invoca cada 6 dias.
    Header esperado: `Authorization: Bearer {SECRET_KEY}`.
    """
    expected = f"Bearer {settings.SECRET_KEY}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not PIPELINE_SCRIPT.exists():
        raise HTTPException(status_code=500, detail=f"Pipeline script not found: {PIPELINE_SCRIPT}")

    try:
        result = subprocess.run(
            [sys.executable, str(PIPELINE_SCRIPT)],
            capture_output=True,
            text=True,
            timeout=1800,  # 30 minutos
            check=False,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Pipeline timeout")

    return {
        "exit_code": result.returncode,
        "stdout_tail": result.stdout[-2000:] if result.stdout else "",
        "stderr_tail": result.stderr[-2000:] if result.stderr else "",
    }
