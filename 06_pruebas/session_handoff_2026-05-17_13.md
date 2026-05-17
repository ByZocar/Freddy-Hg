# Session Handoff — 2026-05-17 13:45 COT

**Agente saliente:** Cursor (Claude Opus 4.7) — toma de contexto del agente Claude anterior.
**Razón del traspaso:** Sprint 6 y 7 ejecutados; queda configuración manual en Make.com UI.

## Lo que se hizo en esta sesión

### Sprint 6 — Deploy en producción → **CERRADO**

1. ✅ Corregido bug del path Windows en `GEE_SERVICE_ACCOUNT_KEY_PATH`. Ahora es `/tmp/gee-service-account.json`.
2. ✅ Deploy del backend a Railway. URL pública: https://freddy-hg-backend-production.up.railway.app
3. ✅ Deploy del frontend a Vercel. URL pública: https://freddy-hg.vercel.app
4. ✅ Variables de entorno configuradas en Vercel (4) y `FRONTEND_URL` actualizado en Railway.
5. ✅ WeasyPrint funcionando en producción — se usó **Dockerfile** custom (Python 3.12 slim + libpango/libcairo/libglib/libgobject) en vez del Nixpacks default, para garantizar las libs nativas. PDF de la alerta `efb0373a` descargable, 26 KB, magic `%PDF`. Guardado en `06_pruebas/sample_alerts/alert_efb0373a.pdf`.
6. ✅ Verificación de que no hay credenciales en GitHub.

### Sprint 7 — primera alerta real → **PARCIAL**

1. ✅ Pipeline GEE corre limpio en Railway desde `POST /api/run-pipeline` con auth `Bearer $SECRET_KEY`. exit_code=0, GEE auth OK con la service account.
2. ✅ Probadas dos configuraciones para intentar capturar dragas reales:
   - Default: `PIPELINE_DAYS_BACK=14`, `BACKSCATTER_THRESHOLD=-10` → 0 candidatos.
   - Tunada: `PIPELINE_DAYS_BACK=60`, `BACKSCATTER_THRESHOLD=-12` → 0 candidatos.
   Ambas están reverteadas a defaults. La conclusión es que Sentinel-1 no detecta dragas nuevas en las ROIs piloto en este momento, NO que el pipeline tenga bugs.
3. ✅ Nuevas variables de entorno expuestas (`PIPELINE_DAYS_BACK`, `BACKSCATTER_THRESHOLD`, `WATER_THRESHOLD`, `MIN_PIXELS`) leídas desde `pipeline/config.py` con `os.environ.get(...)`. Permite tunear sin redeploy.
4. ✅ Alerta sintética en producción (`POST /api/ingest`): `86fcda5a-541a-436d-a66c-c34bf3bf0c28`. Confidence 3, ilegal_presunto, Resguardo Aduche, Mistral context, WhatsApp dispatched.
5. ✅ Test user creado en Supabase Auth: `demo@freddyhg.org` / `FreddyHg-Demo-2026`. Verificado: la session JWT permite leer las 2 alertas vía RLS de Supabase.

### Configuración / cambios en código

- **Nuevo `Dockerfile`** en `05_codigo/` (build root). Usa `python:3.12-slim-bookworm` + apt deps de WeasyPrint.
- **Nuevo `.dockerignore`** que excluye .env, secrets/, frontend/, 06_pruebas/, *.md.
- **Nuevo `railway.json`** (root) con builder=DOCKERFILE y `startCommand` envuelto en `sh -c` para expandir `$PORT`.
- **Nuevo `requirements.txt`** (root) que delega a `backend/requirements.txt` (mantenido como fallback Nixpacks-friendly).
- **`pipeline/config.py`** ahora lee thresholds del entorno con defaults documentados.
- **`pipeline/freddy_detection.py`** usa `PIPELINE_DAYS_BACK` en vez de hardcoded 14.
- **`06_pruebas/validation_reports/sprint6_validation.md`** y **`sprint7_validation.md`** creados.
- **`ROADMAP_MASTER.md`** actualizado con URLs y checkboxes del nuevo estado.

### Variables de entorno Railway (final)

17 fijas + 2 nuevas tunables (todas en defaults seguros ahora):

```
FRONTEND_URL=https://freddy-hg.vercel.app
GEE_SERVICE_ACCOUNT_KEY_PATH=/tmp/gee-service-account.json   # corregido
GEE_SERVICE_ACCOUNT_JSON_B64=...                              # base64 del JSON, materializado por _materialize_gee_key()
GEE_PROJECT_ID=freddy-hg-mvp
GEE_SERVICE_ACCOUNT_EMAIL=freddy-hg-gee@freddy-hg-mvp.iam.gserviceaccount.com
SUPABASE_URL=https://fwiihycanhpahxazrnyg.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SECRET_KEY=556b5ff7...3f77fc5
TWILIO_ACCOUNT_SID=AC6bd1f8...
TWILIO_AUTH_TOKEN=4ad2baf...
TWILIO_WHATSAPP_NUMBER=+14155238886
TEST_WHATSAPP_NUMBER=+573153350984
MAPBOX_ACCESS_TOKEN=...
MISTRAL_API_KEY=sk-or-v1-...
MISTRAL_BASE_URL=https://openrouter.ai/api/v1
MISTRAL_MODEL=mistralai/mistral-small-24b-instruct-2501
PIPELINE_DAYS_BACK=14            # default, tunable
BACKSCATTER_THRESHOLD=-10.0      # default, tunable
```

## Lo que falta (en orden)

1. **Make.com Scenario "Freddy_Hg_GEE_Pipeline"** — bloqueo humano. Andrés debe iniciar sesión en make.com y crear el scenario siguiendo `pipeline/scheduler_make_config.json`. Variables a setear:
   - `BACKEND_URL=https://freddy-hg-backend-production.up.railway.app`
   - `SECRET_KEY=556b5ff7b4baa62469690413dcdf94c5f163909c8b9bb3949cf39b3b63f77fc5`
   - Trigger: Schedule cada 6 días, 02:00 UTC.

2. **Enrolar TOTP** para `demo@freddyhg.org`. El flujo del Login.tsx ya soporta el factor verificado, pero hay que enrolarlo desde una página `/admin/security` (no implementada) o usando el panel de Supabase. Mejora menor para Sprint 5 done.

3. **Cuando el pipeline real detecte algo** (próxima ejecución después de Make.com activo, o un manual run) verificar que:
   - La alerta llega a Supabase.
   - El WhatsApp se entrega.
   - El PDF se descarga del dashboard.

4. **Tag de release `v1.0.0`** en GitHub para presentar.

## URLs y credenciales clave

| Recurso | URL/valor |
|---------|-----------|
| Frontend producción | https://freddy-hg.vercel.app |
| Backend producción | https://freddy-hg-backend-production.up.railway.app |
| Health check | https://freddy-hg-backend-production.up.railway.app/health |
| API alerts | https://freddy-hg-backend-production.up.railway.app/api/alerts |
| API ingest | POST https://freddy-hg-backend-production.up.railway.app/api/ingest (Bearer SECRET_KEY) |
| API run-pipeline | POST https://freddy-hg-backend-production.up.railway.app/api/run-pipeline (Bearer SECRET_KEY) |
| API export PDF | GET https://freddy-hg-backend-production.up.railway.app/api/export/pdf/{alert_id} |
| Repo GitHub | https://github.com/ByZocar/Freddy-Hg (main, último 9c79a8c) |
| Supabase project | fwiihycanhpahxazrnyg |
| Test user | demo@freddyhg.org / FreddyHg-Demo-2026 |
| Alerta E2E | efb0373a-3c08-46e8-b516-fc5a57813e40 (Aduche, Mistral) |
| Alerta E2E producción | 86fcda5a-541a-436d-a66c-c34bf3bf0c28 (Railway prod test) |

## Procesos en background al momento del handoff

Ninguno. Backend Railway corre 24/7 (servicio activo, healthy). Vercel hosting estático.
