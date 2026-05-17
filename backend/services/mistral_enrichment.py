"""Enriquecimiento NLP via Mistral AI (a traves de OpenRouter o API directa).

Cada alerta se enriquece con:
  - mistral_context: parrafo en lenguaje natural sobre la zona, riesgos, contexto historico.
  - impact_metrics: dict con mercury_kg, damage_usd, people_at_risk estimados.

Si Mistral falla, el sistema continua (graceful degradation).
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any, Optional

import httpx

from ..config import settings


logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "Eres un analista experto en mineria ilegal aurifera en la Amazonia colombiana. "
    "Recibes una alerta de deteccion SAR y debes producir un objeto JSON con cuatro campos: "
    "context (string, max 350 caracteres, parrafo sobre la zona, riesgos y poblacion), "
    "mercury_kg (entero, kilogramos de mercurio estimados liberados al ano), "
    "damage_usd (entero, dano economico estimado en USD), "
    "people_at_risk (entero, personas en riesgo aguas abajo). "
    "Responde EXCLUSIVAMENTE con el JSON, sin texto adicional, sin codigo markdown."
)


_JSON_RE = re.compile(r"\{[\s\S]*\}")


def _build_user_prompt(alert: dict[str, Any]) -> str:
    return (
        f"Alerta SAR detectada:\n"
        f"- Coordenadas: {alert.get('centroid_lat'):.4f}, {alert.get('centroid_lon'):.4f}\n"
        f"- Nivel de confianza: {alert.get('confidence_level')}/3\n"
        f"- Estado legal (ANM): {alert.get('legal_status')}\n"
        f"- Territorio indigena: {alert.get('indigenous_territory') or 'No'}\n"
        f"- Area estimada: {alert.get('area_m2')} m2\n"
        f"- Actividad nueva vs baseline 2018-2019: {alert.get('is_new_activity')}\n"
        f"Devuelve ahora el JSON solicitado."
    )


def _parse_json_loose(text: str) -> Optional[dict[str, Any]]:
    """Intenta parsear JSON aun cuando el modelo lo envuelve en texto/markdown."""
    text = text.strip()
    # Caso 1: JSON puro
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Caso 2: ```json ... ``` fences
    fenced = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except json.JSONDecodeError:
            pass
    # Caso 3: el primer {...} balanceado
    m = _JSON_RE.search(text)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            return None
    return None


def _coerce_int(value: Any, default: int = 0) -> int:
    """Convierte strings tipo '40000 USD' o '5,000' en enteros tolerantemente."""
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        digits = re.findall(r"-?\d+", value.replace(",", "").replace(".", ""))
        if digits:
            try:
                return int(digits[0])
            except ValueError:
                return default
    return default


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
        "temperature": 0.2,
        "max_tokens": 900,
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
        parsed = _parse_json_loose(content)
        if not parsed:
            logger.warning("Mistral returned non-JSON content: %r", content[:200])
            return None
        return {
            "mistral_context": str(parsed.get("context", "")).strip()[:500],
            "mistral_model": settings.MISTRAL_MODEL,
            "impact_metrics": {
                "mercury_kg": _coerce_int(parsed.get("mercury_kg")),
                "damage_usd": _coerce_int(parsed.get("damage_usd")),
                "people_at_risk": _coerce_int(parsed.get("people_at_risk")),
            },
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("Mistral enrichment failed: %s", exc)
        return None
