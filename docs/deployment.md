# Guía de despliegue — Freddy Hg

## Stack en producción

| Componente | Servicio | URL típica |
|------------|----------|-----------|
| Backend | Railway | `freddy-hg-backend.up.railway.app` |
| Frontend | Vercel | `freddy-hg.vercel.app` |
| Database | Supabase | `<ref>.supabase.co` |
| Scheduler | Make.com | `hook.make.com/<id>` |

## Backend en Railway

1. `railway login`
2. En el repo: `railway init` (o conectar vía GitHub en railway.app)
3. Configurar variables de entorno desde el dashboard de Railway:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, `TEST_WHATSAPP_NUMBER`
   - `MAPBOX_ACCESS_TOKEN`
   - `MISTRAL_API_KEY`, `MISTRAL_BASE_URL`, `MISTRAL_MODEL`
   - `SECRET_KEY`
   - `GEE_SERVICE_ACCOUNT_EMAIL`, `GEE_PROJECT_ID`
   - `FRONTEND_URL=https://<vercel-domain>`
4. Subir el JSON GEE como Railway "Secret File": `/app/secrets/gee-service-account.json`
5. `railway up` (o push a main si está conectado a GitHub).
6. Verificar: `curl https://<railway-url>/health` → `{"status":"ok"}`

## Frontend en Vercel

1. `vercel link` desde `frontend/`.
2. Configurar variables de entorno en Vercel dashboard:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`, `VITE_BACKEND_URL`
3. `vercel --prod`.

## Schema en Supabase

Opción A — Editor SQL del dashboard:
1. Supabase Dashboard → SQL Editor → New query.
2. Pegar el contenido de `backend/sql/001_initial_schema.sql`.
3. Run.

Opción B — Script Python:
1. Añadir `POSTGRES_PASSWORD=` al `.env` (Settings → Database → Connection string).
2. `python -m backend.scripts.apply_schema`.

## Make.com Scenario

Importar `pipeline/scheduler_make_config.json` o configurar
manualmente siguiendo el doc. Variables: `BACKEND_URL`, `SECRET_KEY`.

## Verificación post-deploy

```bash
# Salud del backend
curl https://<railway-url>/health

# Lectura pública (debe funcionar sin token)
curl https://<railway-url>/api/public/alerts

# Schema OK (debería devolver un array vacío en limpio)
curl https://<railway-url>/api/alerts
```

## Costes mensuales esperados

| Servicio | Costo |
|----------|-------|
| Railway Hobby | $5 |
| Vercel Hobby | $0 |
| Supabase Free | $0 (hasta 500 MB, 50k MAU) |
| Twilio | $5–15 (volumen real piloto) |
| Mistral / OpenRouter | $5–15 |
| **Total** | **~$15–35 USD/mes** |
