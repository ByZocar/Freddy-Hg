# Session Handoff — 2026-05-17 12:30 COT

**Agente saliente:** Claude (sesión de Andrés, Windows).
**Razón del traspaso:** Límite de uso próximo. Continuación en Cursor.

## Donde nos quedamos

Último commit: `226f27a feat(pipeline): GEE auth + reduceToVectors fix + 14-day window`
Branch: `main`. Remoto: `https://github.com/ByZocar/Freddy-Hg.git`. Trabajo
limpio en local (sin cambios sin commit). Backend NO está corriendo en este
momento (uvicorn detenido).

### Lo que YA está hecho y verificado

| Sprint | Estado | Notas |
|--------|--------|-------|
| 0. Repo + estructura | ✅ | Apache 2.0, .env y secrets gitignoreados |
| 1. DB + Backend core | ✅ | 5/5 tablas Supabase, RLS + view `public_alerts` |
| 3. Twilio + PDF | ✅ | WhatsApp llegó a +573153350984; PDF/HTML OK |
| 3.5. Mistral NLP | ✅ | Modelo `mistralai/mistral-small-24b-instruct-2501` |
| 4. Frontend | ✅ build | Vite build 94 módulos, dev server 200 |
| 5. Auth + Estados + Admin | ✅ API | 2FA UI lista (Login.tsx), endpoints verificados |
| **2. Pipeline GEE** | 🟡 corre limpio | 0 candidatos en últimos 14 días (algoritmo OK pero quizás threshold restrictivo) |
| **6. Deploy** | 🟡 a medias | Railway: proyecto + servicio + 17 env vars listos. NO se ejecutó `railway up` todavía. Vercel: NO iniciado. |
| 7. Piloto + alerta real | ⏳ | Depende del deploy |

### Tests

- `pytest backend/tests/ pipeline/tests/ -v` → **16/16 pasan**.
- Alerta E2E real en Supabase: `efb0373a-3c08-46e8-b516-fc5a57813e40`.
- 5 organizaciones piloto sembradas (Corpoamazonía, CDA, Gaia Amazonas, FCDS, Fiscalía DEMA).

### Credenciales / IDs ya configurados

- Supabase project ref: `fwiihycanhpahxazrnyg`
- Supabase URL: `https://fwiihycanhpahxazrnyg.supabase.co`
- Railway project ID: `e7fa1ad4-80fb-4c4c-831c-eac2fb7db738`
- Railway service: `freddy-hg-backend` (ID `1aa60d19-0916-40c4-813d-c8f88491f7aa`)
- Railway env: `production`, ID `5b7f054a-4112-4376-ace7-454c41951b89`
- Vercel user: `byzocar`
- GitHub repo: `ByZocar/Freddy-Hg`
- GEE service account: `freddy-hg-gee@freddy-hg-mvp.iam.gserviceaccount.com`
- GEE project: `freddy-hg-mvp` (IAM ya tiene Service Usage Consumer + Earth Engine Resource Viewer/Admin)
- Mistral model en uso: `mistralai/mistral-small-24b-instruct-2501`

## Lo que falta hacer (en orden)

### Inmediato (5–10 min): cerrar el deploy de Railway

1. **Fix env var con path Windows incorrecto.** Cuando seté
   `GEE_SERVICE_ACCOUNT_KEY_PATH=/tmp/gee-service-account.json` desde git bash,
   se expandió a `C:/Users/andre/AppData/Local/Temp/gee-service-account.json`
   (típico de MINGW). En PowerShell normal:
   ```powershell
   cd "C:\Users\andre\Documents\Freddy Hg\05_codigo"
   railway variables --set "GEE_SERVICE_ACCOUNT_KEY_PATH=/tmp/gee-service-account.json"
   railway variables --kv | Select-String GEE_SERVICE_ACCOUNT_KEY_PATH
   ```
   Debe mostrar literalmente `/tmp/gee-service-account.json`.

2. **Deploy backend.** Desde la raíz de `05_codigo`:
   ```powershell
   railway up --detach
   ```
   Esto sube el código actual, Nixpacks detecta Python + `Procfile`,
   instala `backend/requirements.txt` y arranca `uvicorn backend.main:app`.
   Tarda ~5 minutos la primera vez.

3. **Conseguir URL pública.** Railway no expone HTTP por defecto:
   ```powershell
   railway domain
   ```
   Genera un dominio tipo `freddy-hg-backend-production-xxxx.up.railway.app`.
   Anótalo.

4. **Verificar:**
   ```powershell
   curl https://<railway-url>/health   # debe devolver {"status":"ok"}
   curl https://<railway-url>/api/alerts | ConvertFrom-Json | % count   # debe ser >= 1
   ```

5. **Ajustar CORS y FRONTEND_URL.** Una vez tengas el dominio Vercel,
   actualiza:
   ```powershell
   railway variables --set "FRONTEND_URL=https://<vercel-domain>"
   ```
   Esto requiere redeploy automático que Railway hace al cambiar vars.

### Deploy de Vercel (10 min)

6. **Link y configura el proyecto.** Desde `05_codigo/frontend`:
   ```powershell
   cd "C:\Users\andre\Documents\Freddy Hg\05_codigo\frontend"
   vercel link --yes --project freddy-hg
   ```

7. **Crea 4 env vars en Vercel** (para `production`):
   ```powershell
   vercel env add VITE_SUPABASE_URL production
   # pega: https://fwiihycanhpahxazrnyg.supabase.co
   vercel env add VITE_SUPABASE_ANON_KEY production
   # pega el valor de .env (línea SUPABASE_ANON_KEY)
   vercel env add VITE_MAPBOX_TOKEN production
   # pega el valor de .env (línea MAPBOX_ACCESS_TOKEN)
   vercel env add VITE_BACKEND_URL production
   # pega la URL de Railway del paso 3
   ```

8. **Deploy a producción:**
   ```powershell
   vercel --prod
   ```
   Output incluye la URL final tipo `freddy-hg-xxxx.vercel.app`.

### Make.com scheduler (15 min, opcional para MVP pero crítico para "automático")

9. Crear Scenario en make.com:
   - Trigger: Schedule cada 6 días, 02:00 UTC.
   - Module HTTP → POST `https://<railway-url>/api/run-pipeline`,
     header `Authorization: Bearer 556b5ff7b4baa62469690413dcdf94c5f163909c8b9bb3949cf39b3b63f77fc5`,
     timeout 1800 seg.
   - Module HTTP → GET `https://<railway-url>/health` para verificación.
   - Module Email → notificar al equipo con `{{1.body.stdout_tail}}`.
   - Config completa en `pipeline/scheduler_make_config.json`.

### Smoke test final + Sprint 7

10. Generar al menos 1 alerta real ejecutando el pipeline en Railway:
    ```powershell
    curl -X POST -H "Authorization: Bearer 556b5ff7..." https://<railway-url>/api/run-pipeline
    ```
11. Si el pipeline sigue devolviendo 0 candidatos en Caquetá/Inírida (porque
    Sentinel-1 no detecta nada nuevo), considerar:
    - **Bajar `BACKSCATTER_THRESHOLD`** de -10 a -12 dB temporalmente para
      tener algo que mostrar en el dashboard.
    - **Ampliar `_date_range(days_back=14)` a 60 días** sólo para el demo.
    - O usar el alerta de prueba que ya existe (`efb0373a-...`) como ejemplo
      "live" en el dashboard.
12. Captura screenshots del dashboard, panel de alerta, y PDF descargado en
    `06_pruebas/screenshots/` para evidencia del piloto.
13. Crear `06_pruebas/validation_reports/sprint6_validation.md` con las URLs
    finales, status HTTPS (SSL Labs), y resultado del smoke test.

### Mejoras "nice-to-have" si queda tiempo

- Code-splitting de Mapbox (bundle actual: 2.2 MB).
- Crear usuario de prueba en Supabase + enrolar TOTP para validar 2FA end-to-end.
- Subir el modelo SAR a HuggingFace Hub (`freddy-hg/sar-mining-detector`)
  con un Model Card según el Sprint 3.5 done criteria.
- Reemplazar el sample RAISG GeoJSON con el dataset real de
  raisg.socioambiental.org.

## Archivos relevantes para Cursor

- `backend/main.py` — agregado `_materialize_gee_key()` para Railway.
- `backend/sql/001_initial_schema.sql` — schema completo (ya aplicado).
- `pipeline/freddy_detection.py` — pipeline GEE (corre clean local).
- `pipeline/config.py` — paths absolutos a la raíz del repo.
- `pipeline/scheduler_make_config.json` — guía paso a paso para Make.com.
- `docs/deployment.md` — guía de deploy completa.
- `frontend/.env.example` y `.env` — variables Vite ya configuradas localmente.
- `.env` (root) — todas las credenciales reales (NUNCA commitear).
- `secrets/gee-service-account.json` — JSON del service account (NUNCA commitear).

## Procesos en background al momento del handoff

Ninguno. Todos los `uvicorn` y `vite` fueron detenidos con `TaskStop`.
