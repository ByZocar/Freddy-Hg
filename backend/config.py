"""Configuración global del backend Freddy Hg.

Carga las variables de entorno desde la raíz del repositorio (`../.env` respecto
de `backend/`). Cualquier variable faltante con valor por defecto NO es crítica;
las que no tienen default son obligatorias y harán fallar el arranque.
"""
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


# Raíz del repo: ../ respecto a backend/config.py
ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    """Variables de entorno tipadas. Sólo se valida en el arranque."""

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""
    TEST_WHATSAPP_NUMBER: str = ""

    # Mapbox (sólo se usa en el front, pero el backend genera mapas estáticos)
    MAPBOX_ACCESS_TOKEN: str = ""

    # Mistral / OpenRouter
    MISTRAL_API_KEY: str = ""
    MISTRAL_BASE_URL: str = "https://openrouter.ai/api/v1"
    MISTRAL_MODEL: str = "mistralai/mistral-small-24b-instruct-2501"

    # GEE
    GEE_SERVICE_ACCOUNT_EMAIL: str = ""
    GEE_PROJECT_ID: str = ""
    GEE_SERVICE_ACCOUNT_KEY_PATH: str = "./secrets/gee-service-account.json"

    # Backend
    SECRET_KEY: str
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    # Postgres directo (para aplicar schema; opcional)
    POSTGRES_PASSWORD: Optional[str] = None

    # Resend — email al funcionario CAR (F-11)
    # SMTP directo no funciona en PaaS (Railway bloquea puerto 587).
    # Usamos Resend HTTP API: free tier 3000 emails/mes.
    # Si no se configura, el email se omite silenciosamente (graceful degradation).
    RESEND_API_KEY: str = ""
    ALERT_EMAIL_FROM: str = "Freddy Hg <onboarding@resend.dev>"
    ALERT_EMAIL_BCC: str = ""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
