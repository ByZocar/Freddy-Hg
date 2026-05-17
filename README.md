# ☿ Freddy Hg

> **Sistema de alerta temprana satelital para minería ilegal de oro en la Amazonía colombiana.**
> Detecta dragas fluviales con Sentinel-1 SAR cada 6 días, genera evidencia legalmente admisible
> y notifica a guardianes indígenas vía WhatsApp.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-MVP-orange.svg)](#)

---

## El problema

- **105.060 ha** de minería aluvial en Colombia (SIMCI 2023), **76 % ilegal**
- **116 ppm** de mercurio en cabello humano en Quibdó — 116× el límite OMS
- **36 años** entre la primera denuncia (1989) y la sentencia judicial (T-106/25, 2025)
- **8.414 millones USD/año** en minería ilegal — principal financiador del crimen organizado en la Amazonía

La minería colombiana es **fluvial** (dragas en ríos) — no deja huella forestal. Ningún sistema
existente la detecta automáticamente. Sentinel-1 SAR puede ver las dragas metálicas a través de las
nubes porque el metal devuelve el pulso radar con 17–30 dB más de intensidad que el agua del río.

## Los 3 features del MVP

1. **Motor SAR automatizado** — Pipeline cada 6 días sobre Sentinel-1 GRD, geofencing contra ANM
   (legalidad) y RAISG (territorios indígenas), nivel de confianza 1/2/3, cadena de custodia con SHA-256.
2. **Dashboard CAR** — Mapa interactivo (Mapbox), panel de detalle, exportación de PDF admisible
   en procesos sancionatorios bajo Ley 1333/2009, login con 2FA.
3. **Alerta WhatsApp al guardián** — Mensaje ≤160 caracteres con río, nivel, coordenadas y enlace
   a mapa estático. Sin app, sin registro. Fallback automático a SMS.

## Stack

| Capa | Tecnología |
|------|-----------|
| Procesamiento SAR | Google Earth Engine (Python API) |
| Backend API | FastAPI (Railway) |
| Base de datos | Supabase (PostgreSQL + PostGIS + Auth + 2FA) |
| Frontend | React 18 + Vite (Vercel) |
| Mapa | Mapbox GL JS |
| Notificaciones | Twilio (WhatsApp Business API + SMS) |
| PDF | WeasyPrint |
| NLP | Mistral AI / Pixtral |
| Scheduler | Make.com |

Costo total operativo estimado: **~$10–25 USD/mes**.

## Estructura del repositorio

```
freddy-hg/
├── pipeline/        # Motor SAR (Google Earth Engine)
├── backend/         # API FastAPI (ingesta, geofencing, PDF, notificaciones)
├── frontend/        # Dashboard React + Vite + Mapbox
├── docs/            # Documentación técnica (incl. /accuracy)
└── 06_pruebas/      # Sandbox de pruebas (logs, ground truth, validations)
```

## Inicio rápido

```bash
# 1. Clonar
git clone https://github.com/ByZocar/Freddy-Hg.git
cd Freddy-Hg

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (Supabase, GEE, Mapbox, Twilio, Mistral)

# 3. Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# 4. Frontend
cd ../frontend
npm install
npm run dev
```

## Zonas piloto

| Zona | CAR responsable | Comunidades | Bounding box |
|------|----------------|-------------|--------------|
| Cuenca alta del Caquetá / Apaporis | Corpoamazonía | ACIYA, PANI, CIMTAR | `[-73.5, -1.5, -71.5, 0.5]` |
| Cuenca del Inírida | CDA | Curripaco, Puinave, Piapoco | `[-68.5, 3.0, -67.5, 4.5]` |

## Cadena de custodia digital

Cada alerta genera un **SHA-256** reproducible sobre los metadatos canónicos (escena Sentinel-1,
fecha UTC, coordenadas, algoritmo, colección). El PDF exportable cumple los requisitos del
proceso sancionatorio colombiano (Ley 1333/2009 y Código General del Proceso) y de la evidencia
satelital admisible ante la Fiscalía.

## Falsos positivos conocidos

Ver [`docs/accuracy.md`](docs/accuracy.md).

## Contribuir

Este es un proyecto open source bajo licencia Apache 2.0. Issues y PRs bienvenidos.

## Crédito

Construido para la competencia 2026. Producto desarrollado con la guía del documento `AGENT.md`
(reglas del Ingeniero Principal de Freddy Hg) y la arquitectura detallada en
`docs/architecture.md`.
