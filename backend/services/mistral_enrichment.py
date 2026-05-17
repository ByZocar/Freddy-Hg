"""Enriquecimiento NLP via Mistral AI (a traves de OpenRouter o API directa).

Cada alerta se enriquece con:
  - mistral_context: parrafo en lenguaje natural sobre la zona, riesgos, contexto historico.
  - impact_metrics: dict con mercury_kg, damage_usd, people_at_risk estimados.

Si Mistral falla, el sistema continua (graceful degradation).
"""
from __future__ import annotations

import json
import logging
from typing import Any, Optional

import httpx

from ..config import settings


logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "Eres un analista experto en mineria ilegal en la Amazonia colombiana. "
    "Recibes una alerta de deteccion SAR y debes producir: "
    "1) Un parrafo (max 350 chars) sobre el contexto regional, riesgos y poblacion afectada. "
    "2) Estimaciones cuantitativas: mercurio (kg/anno), dano economico (USD), personas en riesgo. "
    "Responde SOLO en JSON valido con keys: context (str), mercury_kg (int), damage_usd (int), people_at_risk (int)."
)


def _build_user_prompt(alert: dict[str, Any]) -> str:
    return (
        f"Alerta SAR detectada:\n"
        f"- Coordenadas: {alert.get('centroid_lat'):.4f}, {alert.get('centroid_lon'):.4f}\n"
        f"- Nivel de confianza: {alert.get('confidence_level')}/3\n"
        f"- Estado legal (ANM): {alert.get('legal_status')}\n"
        f"- Territorio indigena: {alert.get('indigenous_territory') or 'No'}\n"
        f"- Area estimada: {alert.get('area_m2')} m2\n"
        f"- Actividad nueva: {alert.get('is_new_activity')}\n"
        f"Devuelve el JSON solicitado."
    )


def enrich_alert(alert: dict[str, Any], timeout: float = 25.0) -> Optional[dict[str, Any]]:
    """Llama Mistral via la URL configurada y devuelve el dict enriquecido.

    Devuelve None si la llamada falla (no rompe el flujo).
    """
    if not settings.MISTRAL_API_KEY:
        logger.info("MISTRAL_API_KEY not set; skipping NLP enrichment")
        return None

    url = f"{settings.MISTRAL_BASE_URL.rstrip('/')}/chat/completions"
    payload = {
        "model": settings.MISTRAL_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(alert)},
        ],
        "temperature": 0.3,
        "max_tokens": 400,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {settings.MISTRAL_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://app.freddyhg.org",
        "X-Title": "Freddy Hg",
    }
    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return {
            "mistral_context": parsed.get("context", ""),
            "mistral_model": settings.MISTRAL_MODEL,
            "impact_metrics": {
                "mercury_kg": int(parsed.get("mercury_kg", 0)),
                "damage_usd": int(parsed.get("damage_usd", 0)),
                "people_at_risk": int(parsed.get("people_at_risk", 0)),
            },
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("Mistral enrichment failed: %s", exc)
        return None
