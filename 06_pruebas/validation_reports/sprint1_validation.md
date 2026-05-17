# Sprint 1 — Reporte de validación

**Fecha:** 2026-05-17
**Sprint:** 1 (Base de datos + Backend core)
**Responsable:** Agente

## Criterios de "done" verificados

- [x] Schema SQL ejecutado en Supabase (5 tablas + RLS + view `public_alerts` + función `hash_phone`)
- [x] FastAPI levanta: `uvicorn backend.main:app` → GET /health → `{"status":"ok"}`
- [x] POST /api/ingest crea alerta con SHA-256
- [x] Geofencing ANM → `legal_status` (vía GeoJSON local, no API)
- [x] Geofencing RAISG → `indigenous_territory` correcto
- [x] Mistral NLP enrichment integrado (Sprint 3.5 anticipado en el mismo flow)
- [x] Tests pasan: 14/14 backend + 2/2 pipeline = 16/16

## Alerta de prueba E2E

```json
{
  "id": "efb0373a-3c08-46e8-b516-fc5a57813e40",
  "confidence_level": 3,
  "legal_status": "ilegal_presunto",
  "indigenous_territory": "Resguardo Aduche",
  "indigenous_nation": "Uitoto / Muinane",
  "sha256_evidence": "5e40e776e9f2650e7b19ddc20da10f680b88030540c94173e53310675f929b1c",
  "mistral_context": "La zona de alerta se encuentra en el Resguardo Indígena Aduche…",
  "impact_metrics": { "mercury_kg": 500, "damage_usd": 1500000, "people_at_risk": 1200 }
}
```

## Endpoints validados (con backend local)

| Endpoint | Método | Status | Resultado |
|----------|--------|--------|-----------|
| /health | GET | 200 | `{"status":"ok"}` |
| / | GET | 200 | metadata |
| /docs | GET | 200 | OpenAPI UI |
| /api/ingest | POST | 200 | alerta persistida + Mistral OK |
| /api/alerts | GET | 200 | 1 alerta |
| /api/alerts/export/geojson | GET | 200 | 1645 bytes |
| /api/alerts/export/csv | GET | 200 | 380 bytes |
| /api/public/alerts | GET | 200 | 0 (esperado: alerta <30 días) |
| /api/export/html/{id} | GET | 200 | 5163 chars HTML |
| /api/export/pdf/{id} | GET | 200 | HTML fallback (WeasyPrint no en Win) |

## Twilio

WhatsApp encolado con SID `SMdc362d1a4d25f37e699a9f6ea4d03082`. Para
entrega real al humano de prueba, el número debe haber enviado
"join &lt;code&gt;" al sandbox `+14155238886` previamente.

## Próximo paso

Sprint 2: pipeline GEE real. Bloqueado por permiso IAM del
service account `freddy-hg-gee@freddy-hg-mvp.iam.gserviceaccount.com`
en el proyecto `freddy-hg-mvp` (necesita
`roles/serviceusage.serviceUsageConsumer`).
