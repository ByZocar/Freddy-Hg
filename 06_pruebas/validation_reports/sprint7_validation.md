# Sprint 7 — Reporte de validación (Piloto + primera alerta real)

**Fecha:** 2026-05-17
**Sprint:** 7 (Onboarding piloto y primera alerta real)
**Estado:** 🟡 En curso — sistema E2E funcional; primera alerta real depende de detecciones GEE

## Setup del piloto

- **Organizaciones piloto sembradas en Supabase (5):**
  Corpoamazonía, CDA Guainía, Gaia Amazonas, FCDS, Fiscalía DEMA
- **WhatsApp de prueba:** `+573153350984` (Andrés) — joined al sandbox Twilio.
- **Backend producción:** https://freddy-hg-backend-production.up.railway.app
- **Frontend producción:** https://freddy-hg.vercel.app
- **Pipeline cron objetivo:** Make.com cada 6 días, 02:00 UTC.

## Pruebas de E2E ya verificadas

### 1. Pipeline GEE remoto desde Railway

Trigger manual: `POST /api/run-pipeline` con `Authorization: Bearer {SECRET_KEY}`.

```
2026-05-17 18:22:01 INFO  GEE inicializado como freddy-hg-gee@freddy-hg-mvp.iam.gserviceaccount.com (project=freddy-hg-mvp)
2026-05-17 18:22:01 INFO  === Procesando caqueta_apaporis ===
2026-05-17 18:23:02 INFO  [caqueta_apaporis] 0 candidatos
2026-05-17 18:23:02 INFO  === Procesando inirida_guainia ===
2026-05-17 18:23:17 INFO  [inirida_guainia] 0 candidatos
2026-05-17 18:23:17 INFO  === Pipeline complete: 0 alertas enviadas ===
exit_code=0, log: /app/06_pruebas/test_logs/2026-05-17_182317_run.json
```

✅ El pipeline corre limpio, GEE auth OK, materializa el JSON via `_materialize_gee_key()`.
🟡 Cero candidatos detectados con la ventana inicial de 14 días y umbral -10 dB.

### 2. Alerta de prueba ingerida en producción (E2E full)

`POST /api/ingest` con payload sintético:

| Campo | Valor |
|-------|-------|
| `alert_id` | `86fcda5a-541a-436d-a66c-c34bf3bf0c28` |
| `confidence_level` | 3 (resguardo + ilegal_presunto) |
| `legal_status` | `ilegal_presunto` (geofencing ANM) |
| `indigenous_territory` | `Resguardo Aduche` (geofencing RAISG) |
| `sha256_evidence` | `b8eea699f1506920799d29023108c8e124b8fcd922df63568f8fd90c02c1efc6` |
| `mistral_context` | enriquecido (~2 s) |
| `notifications_dispatched` | `true` (Twilio sandbox) |

✅ Mistral, geofencing, SHA-256, persistencia y dispatch operativos.

### 3. PDF descargado del backend

`GET /api/export/pdf/efb0373a-3c08-46e8-b516-fc5a57813e40`:
- Status `200`, Content-Type `application/pdf`, magic bytes `%PDF`, tamaño 26 KB.
- Generado por WeasyPrint en el container Docker (no fallback HTML).
- Guardado: `06_pruebas/sample_alerts/alert_efb0373a.pdf`.

## Tunables expuestos via env (para piloto / demo)

Para flexibilizar el piloto sin redeploys de código se añadieron variables de entorno:

| Variable | Default | Comentario |
|----------|---------|-----------|
| `PIPELINE_DAYS_BACK` | 14 | Tamaño de la ventana temporal del pipeline (en días). Subir a 60 da más oportunidades de captura, a costa de menos "actualidad". |
| `BACKSCATTER_THRESHOLD` | -10.0 | dB para considerar pixel "brillante" (Schwartz 2019). Más bajo (-12) = más sensible. |
| `WATER_THRESHOLD` | -15.0 | dB para máscara de agua. |
| `MIN_PIXELS` | 2 | Pixeles contiguos mínimos (~200 m²). |

Cambio: `pipeline/config.py` ahora lee estos valores via `os.environ.get(...)` con fallbacks a los defaults documentados en `ROADMAP_MASTER.md`.

## Decisión para el demo en vivo

Si la próxima ejecución del pipeline (con ventana ampliada) sigue devolviendo 0 candidatos, la presentación del piloto se hace con la alerta `efb0373a` (Aduche, enriched con Mistral) como ejemplo "real" del sistema. Se documenta abiertamente como evidencia E2E del flujo, no como una detección genuina de minería.

## Pendientes Sprint 7

- [ ] Configurar Make.com Scenario "Freddy_Hg_GEE_Pipeline" (ver `pipeline/scheduler_make_config.json`).
- [ ] Esperar a que la próxima detección genuina llegue al dashboard.
- [ ] Capturar pantallas del dashboard cargando `efb0373a` y panel + PDF generado, en `06_pruebas/screenshots/`.
- [ ] Crear usuario de prueba en Supabase Auth con TOTP enrolado para validar 2FA E2E (Login.tsx ya tiene el flujo).
