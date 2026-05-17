# API REST — Freddy Hg

Documentación generada también automáticamente en `/docs` (OpenAPI) y `/redoc` por FastAPI.

## Autenticación

- **Ingesta** (`POST /api/ingest`, `POST /api/run-pipeline`):
  `Authorization: Bearer <SECRET_KEY>`. Sólo lo usa el pipeline GEE y Make.com.
- **Lectura autenticada** (`GET /api/alerts`, etc.): sesión JWT de Supabase.
  Para entornos server-to-server, usar el `SUPABASE_SERVICE_ROLE_KEY` como `apikey`.
- **Endpoints públicos** (`GET /api/public/alerts`, `GET /api/alerts/export/*`):
  no requieren token. Los exports respetan RLS.

## Endpoints

### `GET /health`
Devuelve `{"status":"ok"}`. Usado por Railway para health checks.

### `POST /api/ingest`
Recibe una detección cruda del pipeline GEE.

Body:
```json
{
  "scene_id": "COPERNICUS/S1_GRD/...",
  "scene_date_utc": "2026-05-10T10:15:01Z",
  "centroid_lat": -1.234567,
  "centroid_lon": -72.345678,
  "backscatter_vv": -8.5,
  "area_m2": 300.0,
  "pixel_count": 3,
  "is_new_activity": true
}
```

Respuesta:
```json
{
  "alert_id": "uuid",
  "confidence_level": 3,
  "sha256": "...",
  "legal_status": "ilegal_presunto",
  "indigenous_territory": "Resguardo Aduche",
  "notifications_dispatched": true
}
```

### `GET /api/alerts`
Lista de alertas con filtros opcionales:
- `confidence_min` (1–3, default 1)
- `legal_status` (`concesion_activa` | `ilegal_presunto` | `verificar`)
- `indigenous_only` (bool)
- `days` (1–730, default 180)
- `limit` (1–1000, default 200)

### `GET /api/alerts/{id}`
Detalle completo de una alerta.

### `GET /api/alerts/{id}/history?radius_km=2`
Alertas previas en un radio (default 2 km) — US-12.

### `GET /api/alerts/export/geojson`
Descarga GeoJSON compatible con QGIS (F-24).

### `GET /api/alerts/export/csv`
Descarga CSV.

### `GET /api/export/pdf/{id}`
PDF de evidencia legal (WeasyPrint). Cumple NF-12.

### `GET /api/public/alerts`
Endpoint público (anon RLS): alertas con >30 días de antigüedad y confianza ≥ 2.

### `POST /api/run-pipeline`
Triggerea el pipeline GEE en el backend. Sólo para Make.com / cron.

### `POST /api/organizations`
Crea una organización. Body: `OrganizationIn`.

### `POST /api/recipients`
Añade un destinatario WhatsApp/SMS. **Nunca** almacena el número en claro
(sólo SHA-256 y referencia a secret store).

### `PUT /api/alerts/{id}/state`
Cambia el estado de una alerta. Body: `{"state":"revisando","notes":"..."}`.

### `GET /api/alerts/{id}/states`
Historial de estados de una alerta.

## Rate limits

El MVP no aplica rate limits explícitos. Railway y Supabase tienen
límites del plan gratuito que son más que suficientes para el piloto.
