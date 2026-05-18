"""Aplica el schema SQL inicial directamente al Postgres de Supabase.

Uso:
    1. Anadir `POSTGRES_PASSWORD=...` al `.env` (Database settings de Supabase).
    2. Ejecutar:  python -m backend.scripts.apply_schema

Si POSTGRES_PASSWORD no esta configurado, el script imprime instrucciones
para pegar manualmente el SQL en el editor de Supabase.
"""
from __future__ import annotations

import sys
from pathlib import Path
from urllib.parse import urlparse

import psycopg2

from backend.config import settings


SQL_DIR = Path(__file__).resolve().parent.parent / "sql"
SQL_FILES_ORDERED = (
    "001_initial_schema.sql",
    "002_alert_id_short.sql",
    "003_recipients_phone_last4.sql",
    "004_seed_demo_alerts.sql",
    "005_public_alerts_tiered_latency.sql",
)


def _build_connection_string() -> str:
    """Construye la cadena Postgres a partir de SUPABASE_URL + password."""
    if not settings.POSTGRES_PASSWORD:
        raise RuntimeError(
            "POSTGRES_PASSWORD no esta configurado. Ve a Supabase Dashboard -> "
            "Settings -> Database -> Connection string, copia el password "
            "y agregalo al .env como POSTGRES_PASSWORD=..."
        )
    parsed = urlparse(settings.SUPABASE_URL)
    host = parsed.hostname or ""
    if not host.endswith(".supabase.co"):
        raise RuntimeError(f"SUPABASE_URL no parece de Supabase: {settings.SUPABASE_URL}")
    project_ref = host.split(".")[0]
    return (
        f"postgresql://postgres.{project_ref}:{settings.POSTGRES_PASSWORD}"
        f"@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
    )


def main() -> int:
    snippets: list[tuple[str, str]] = []
    for name in SQL_FILES_ORDERED:
        path = SQL_DIR / name
        if not path.exists():
            continue
        snippets.append((name, path.read_text(encoding="utf-8")))
    if not snippets:
        print(f"⚠️  No hay archivos SQL en {SQL_DIR}")
        return 2

    total = sum(len(txt) for _, txt in snippets)
    print(f"📄 Scripts SQL ({len(snippets)} archivo(s), {total} chars total):")

    try:
        conn_str = _build_connection_string()
    except RuntimeError as exc:
        print(f"\n⚠️  {exc}\n")
        print("Como alternativa, abre Supabase Dashboard -> SQL Editor -> New query,")
        print("pega los archivos de backend/sql/ en orden (002 despues de 001) y ejecuta.")
        return 2

    print("🔌 Conectando a Supabase Postgres...")
    try:
        with psycopg2.connect(conn_str) as conn:
            conn.autocommit = True
            with conn.cursor() as cur:
                for fname, sql in snippets:
                    print(f"  ▶ {fname}")
                    cur.execute(sql)
            print("✅ Schema aplicado con exito.")
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema='public' ORDER BY table_name;"
                )
                tables = [r[0] for r in cur.fetchall()]
            print(f"📊 Tablas presentes: {tables}")
    except psycopg2.Error as exc:
        print(f"❌ Error de Postgres: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
