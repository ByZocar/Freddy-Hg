"""Cliente Supabase y helpers de base de datos."""
from functools import lru_cache

from supabase import Client, create_client

from .config import settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Cliente Supabase con el service role key (para escritura sin RLS)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


@lru_cache(maxsize=1)
def get_anon_client() -> Client:
    """Cliente Supabase con el anon key (sometido a RLS)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


# Atajo conveniente (se llama frecuentemente)
supabase_client = get_supabase_client()
