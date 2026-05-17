# 06_pruebas — Sandbox del agente

Este directorio es el espacio de pruebas del agente constructor.
Está gitignoreado para outputs binarios y JSON; sólo los README y
fixtures permanentes se versionan.

## Subdirectorios

- `test_logs/` — logs de cada ejecución del pipeline (`YYYY-MM-DD_HHMMSS_run.json`).
- `ground_truth/` — GeoJSONs de dragas documentadas (MAAP, Armada, T-106/25).
- `validation_reports/` — un reporte por sprint en Markdown.
- `sample_alerts/` — alertas de prueba completas (JSON) para regresión.
- `screenshots/` — capturas del dashboard para verificar UI.

Protocolo: cada sprint genera al menos un `validation_reports/sprintN_validation.md`
con los criterios de done verificados.
