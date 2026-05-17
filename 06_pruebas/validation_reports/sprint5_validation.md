# Sprint 5 — Reporte de validación

**Fecha:** 2026-05-17
**Sprint:** 5 (Auth 2FA + Estados + Admin)

## Criterios de "done" verificados

- [~] 2FA TOTP — código de Login.tsx implementado (Supabase `mfa.challenge` +
  `mfa.verify`). Verificación end-to-end pendiente: requiere un usuario real
  en Supabase Auth con factor TOTP enrolado.
- [x] Botones de estado actualizan en Supabase
  - `PUT /api/alerts/{id}/state` con `{"state":"revisando", "notes":"..."}` → 200
  - `PUT /api/alerts/{id}/state` con `{"state":"en_campo", "notes":"..."}` → 200
  - `GET /api/alerts/{id}/states` → 2 eventos en orden inverso cronológico
  - Eventos también persistidos en `audit_log`
- [x] Admin ONG puede añadir destinatario sin ayuda técnica
  - `POST /api/recipients` con `{organization_id, phone_number}` → 200, devuelve hash
  - `GET /api/recipients/{org_id}` lista activos
  - Verificado: el número en claro nunca aparece en `recipients.phone_number_hash`
- [x] Exportación GeoJSON abre en QGIS (formato válido)
  - `GET /api/alerts/export/geojson` devuelve `application/geo+json` 1645 bytes
  - Estructura: `{type: FeatureCollection, features: [{type: Feature, geometry: Point, properties: {...}}]}`
- [x] Filtros de mapa funcionan
  - `GET /api/alerts?confidence_min=2&indigenous_only=true` aplica filtros
  - `Dashboard.tsx` tiene selectores reactivos para `confidence_min` y `indigenous_only`

## Próximos pasos (en este sprint o el 7)

1. Crear un usuario test en Supabase Auth + enrolar TOTP con Google Authenticator
   para validar el flujo de login real.
2. Capturar screenshots del Dashboard, Login, Admin y Public en `06_pruebas/screenshots/`.
