# Sprint 6 — Reporte de validación (Deploy en producción)

**Fecha:** 2026-05-17
**Sprint:** 6 (Deploy en Railway + Vercel)
**Estado:** ✅ Completo

## URLs en producción

| Servicio | URL | Status |
|----------|-----|--------|
| Backend (Railway) | https://freddy-hg-backend-production.up.railway.app | ✅ HTTPS, healthy |
| Frontend (Vercel) | https://freddy-hg.vercel.app | ✅ HTTPS, sin auth wall |
| Database (Supabase) | https://fwiihycanhpahxazrnyg.supabase.co | ✅ Conectado |
| Repo público | https://github.com/ByZocar/Freddy-Hg | ✅ Apache 2.0 |

## Smoke test E2E (2026-05-17 17:35–17:45 UTC)

| # | Endpoint | Resultado |
|---|----------|-----------|
| 1 | `GET /health` | `200 {"status":"ok","service":"freddy-hg-backend"}` |
| 2 | `GET /api/alerts` | `200` count=2 (alerta `efb0373a` enriquecida + `86fcda5a` test prod) |
| 3 | `GET /api/public/alerts` | `200` count=0 (correcto: las alertas <30 días no son públicas) |
| 4 | `POST /api/ingest` | `200` alert_id=`86fcda5a-541a-436d-a66c-c34bf3bf0c28`, sha256=`b8eea699…02c1efc6`, confidence=3, legal_status=ilegal_presunto, indigenous_territory="Resguardo Aduche", `notifications_dispatched=true` |
| 5 | `GET https://freddy-hg.vercel.app` | `200` HTML+JS (bundle 2.2 MB, gzip 614 kB) |

## Detalle de la alerta de prueba en producción (Railway → Supabase)

- **alert_id:** `86fcda5a-541a-436d-a66c-c34bf3bf0c28`
- **scene_id:** `RAILWAY_PROD_TEST_001`
- **centroid:** lat=-0.45, lon=-72.15 (Caquetá-Apaporis, Resguardo Aduche)
- **SHA-256:** `b8eea699f1506920799d29023108c8e124b8fcd922df63568f8fd90c02c1efc6`
- **legal_status:** `ilegal_presunto` (geofencing ANM/RAISG ejecutado en Railway)
- **mistral enrichment:** ejecutado in-process, ~2 s
- **WhatsApp dispatch:** Twilio sandbox → +573153350984

## Configuración Railway

- **Project ID:** `e7fa1ad4-80fb-4c4c-831c-eac2fb7db738`
- **Service ID:** `1aa60d19-0916-40c4-813d-c8f88491f7aa`
- **Builder:** Nixpacks
- **Build root:** `05_codigo/`
- **Variables de entorno:** 17 (Supabase, Twilio, Mistral, GEE, Mapbox, Frontend URL, etc.)
- **GEE service account:** materializado vía `GEE_SERVICE_ACCOUNT_JSON_B64` → `/tmp/gee-service-account.json` por `_materialize_gee_key()` en `backend/main.py`.
- **WeasyPrint runtime libs:** instaladas vía `nixpacks.toml` (libpango, libcairo, libgobject/libglib, libharfbuzz, fonts-liberation, shared-mime-info).

## Configuración Vercel

- **Team/Project:** `byzocars-projects/freddy-hg`
- **Framework auto-detect:** Vite + React 18
- **Build:** `tsc -b && vite build` → 94 módulos transformados, dist 2.24 MB
- **Variables de entorno (production):**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_MAPBOX_TOKEN`
  - `VITE_BACKEND_URL=https://freddy-hg-backend-production.up.railway.app`
- **Headers configurados (vercel.json):** `X-Content-Type-Options=nosniff`, `X-Frame-Options=DENY`, `Referrer-Policy=strict-origin-when-cross-origin`.

## Seguridad

- ✅ HTTPS automático en Railway (cert por Let's Encrypt) y Vercel (cert por Let's Encrypt).
- ✅ `.env`, `secrets/*.json` excluidos por `.gitignore` (verificado con `git status`).
- ✅ `git log --all -p` no muestra credenciales en el repo (solo `.env.example`).
- ✅ CORS limitado a `https://freddy-hg.vercel.app`, `http://localhost:5173`, `https://app.freddyhg.org`.
- ✅ Endpoints sensibles (`/api/ingest`, `/api/run-pipeline`) requieren `Authorization: Bearer SECRET_KEY`.
- ✅ Supabase: RLS activo en todas las tablas; `recipients.phone_number_hash` es `sha256` (no plaintext).

## Criterios de "done" del Sprint 6

- [x] Backend en Railway responde a `/health` con `{"status":"ok"}`
- [x] Frontend en Vercel carga con HTTPS sin auth wall
- [x] Pipeline de ingestión funcional remoto: `POST /api/ingest` crea alerta en Supabase, dispara Mistral + WhatsApp
- [x] Sin credenciales en el repo público
- [x] CORS y SSL OK
- [ ] Pipeline GEE remoto vía Make.com (Sprint 7) — pendiente activación de scenario
- [ ] SSL Labs grade A — verificación pendiente (subdominios `*.up.railway.app` y `*.vercel.app` heredan el cert del proveedor; ambos muestran TLS 1.3 + HSTS)

## Notas / pendientes menores

1. El bundle Vite (2.2 MB) podría code-splittearse para Mapbox; no bloquea el demo pero mejoraría el LCP.
2. WhatsApp en producción: Twilio sandbox sigue requiriendo el `join` del receptor; para producción real (Sprint 7+) se requeriría un Twilio sender aprobado.
3. La alerta de prueba `86fcda5a` quedó persistida en Supabase. Se mantiene como evidencia del E2E — puede borrarse si se quiere dejar la BD limpia para el demo.
