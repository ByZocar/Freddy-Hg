/**
 * ☿ FREDDY Hg — AlertMap
 * Spec: FRONTEND_SPEC_COMPLETO.md § Pantalla 3 — Zona C.
 *
 * Estilo: mapbox dark-v11
 * Marcadores: critical (pulsante rojo) / warning (naranja) / monitor (dorado)
 * Capas controlables: alertas / ríos / ANM / RAISG / áreas protegidas
 * Controles oscuros propios (zoom, compass, layers, count badge, center button).
 *
 * Las capas externas se cargan perezosamente desde archivos GeoJSON
 * servidos por el backend (Supabase Storage o estáticos).
 */
import { useEffect, useRef } from 'react';
import mapboxgl, { Popup } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  IconCurrentLocation,
  IconLayersIntersect,
  IconMinus,
  IconPlus,
} from '@tabler/icons-react';
import { createRoot } from 'react-dom/client';
import type { Alert } from '../hooks/useAlerts';
import type { LayerToggles } from './layout/Sidebar';
import {
  formatCoords,
  formatRelative,
  inferRiverName,
  legalStatusLabel,
  levelToTone,
} from '../lib/format';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

const ZONA_CAQUETA: [[number, number], [number, number]] = [
  [-73.5, -1.5],
  [-71.5, 0.5],
];
const ZONA_INIRIDA: [[number, number], [number, number]] = [
  [-68.5, 3.0],
  [-67.5, 4.5],
];

const COLOR_FOR_LEVEL = {
  1: '#C8860A',
  2: '#E87820',
  3: '#D4380A',
} as const;

interface Props {
  alerts: Alert[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  layers: LayerToggles;
}

function buildPopupHTML(alert: Alert): string {
  const tone = levelToTone(alert.confidence_level);
  const toneColor = tone === 'critical' ? '#F07050' : tone === 'warning' ? '#F0A060' : '#E8A820';
  const river = inferRiverName(alert.centroid_lat, alert.centroid_lon);
  const legal = legalStatusLabel(alert.legal_status);

  return `
    <div style="font-family: 'IBM Plex Sans', sans-serif; color: #F2EDD8;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <span style="
          background: rgba(${tone === 'critical' ? '212,56,10' : tone === 'warning' ? '232,120,32' : '200,134,10'},0.15);
          border: 0.5px solid rgba(${tone === 'critical' ? '212,56,10' : tone === 'warning' ? '232,120,32' : '200,134,10'},0.4);
          color: ${toneColor};
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 10px;
          letter-spacing: 0.06em;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        ">Nivel ${alert.confidence_level}</span>
        <strong style="font-size: 13px;">${river}</strong>
      </div>
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #C8860A; margin-bottom: 4px;">
        ${formatCoords(alert.centroid_lat, alert.centroid_lon)}
      </div>
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #A89878; margin-bottom: 6px;">
        Detectado ${formatRelative(alert.created_at)} · ${legal.short}
      </div>
      <div style="font-family: 'IBM Plex Sans', sans-serif; font-size: 12px; color: #A89878;">
        Clic para ver detalle →
      </div>
    </div>
  `;
}

function buildMarker(alert: Alert, onClick: () => void): mapboxgl.Marker {
  const tone = levelToTone(alert.confidence_level);
  const el = document.createElement('div');
  el.className = `fhg-marker fhg-marker--${tone}`;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `Alerta nivel ${alert.confidence_level}`);
  el.style.cursor = 'pointer';
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([
    alert.centroid_lon,
    alert.centroid_lat,
  ]);
}

function setLayerVisibility(map: mapboxgl.Map, id: string, visible: boolean) {
  if (!map.getLayer(id)) return;
  map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
}

export default function AlertMap({ alerts, selectedId, onSelect, layers }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<Popup | null>(null);
  const styleLoadedRef = useRef(false);

  // === Init map ===
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!mapboxgl.accessToken) {
      // Sin token: mostrar mensaje en el contenedor para evitar pantalla en blanco
      containerRef.current.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6A5A40;font-family:\'IBM Plex Mono\',monospace;font-size:13px;padding:24px;text-align:center">VITE_MAPBOX_TOKEN no configurado.<br/>El mapa no puede cargar sin token.</div>';
      return;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-71.0, 0.5],
      zoom: 5.2,
      attributionControl: false,
    });
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right',
    );
    mapRef.current = map;

    map.on('load', () => {
      styleLoadedRef.current = true;
      addCustomLayers(map);
      // Pulse global de markers viene del CSS
    });

    return () => {
      map.remove();
      mapRef.current = null;
      styleLoadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Sync markers ===
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers not in new alerts
    const newIds = new Set(alerts.map((a) => a.id));
    markersRef.current.forEach((marker, id) => {
      if (!newIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    for (const alert of alerts) {
      if (markersRef.current.has(alert.id)) continue;
      const marker = buildMarker(alert, () => onSelect(alert.id));
      marker.addTo(map);

      // Hover: show popup
      const el = marker.getElement();
      el.addEventListener('mouseenter', () => {
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({
          offset: 18,
          closeButton: false,
          closeOnClick: false,
          className: 'fhg-popup',
        })
          .setLngLat([alert.centroid_lon, alert.centroid_lat])
          .setHTML(buildPopupHTML(alert))
          .addTo(map);
      });
      el.addEventListener('mouseleave', () => {
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });
      markersRef.current.set(alert.id, marker);
    }
  }, [alerts, onSelect]);

  // === Pan to selected ===
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const alert = alerts.find((a) => a.id === selectedId);
    if (!alert) return;
    map.flyTo({
      center: [alert.centroid_lon, alert.centroid_lat],
      zoom: Math.max(map.getZoom(), 10),
      essential: true,
      duration: 600,
    });
  }, [selectedId, alerts]);

  // === Layer toggles ===
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;
    // alertas se gestionan vía DOM markers (toggle por opacidad)
    markersRef.current.forEach((marker) => {
      marker.getElement().style.display = layers.alerts ? 'flex' : 'none';
    });
    setLayerVisibility(map, 'fhg-rivers', layers.rivers);
    setLayerVisibility(map, 'fhg-anm-fill', layers.anm);
    setLayerVisibility(map, 'fhg-anm-line', layers.anm);
    setLayerVisibility(map, 'fhg-raisg-fill', layers.raisg);
    setLayerVisibility(map, 'fhg-raisg-line', layers.raisg);
    setLayerVisibility(map, 'fhg-pilot-fill', layers.protected);
    setLayerVisibility(map, 'fhg-pilot-line', layers.protected);
  }, [layers]);

  // === Controls handlers ===
  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 200 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 200 });
  const handleCenter = () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = new mapboxgl.LngLatBounds(ZONA_CAQUETA[0], ZONA_CAQUETA[1]);
    bounds.extend(ZONA_INIRIDA[0]);
    bounds.extend(ZONA_INIRIDA[1]);
    map.fitBounds(bounds, { padding: 80, duration: 700, maxZoom: 8 });
  };

  return (
    <div className="map-container">
      <div ref={containerRef} className="map-container__map" />

      <div className="map-controls">
        <div className="map-control-group">
          <button
            type="button"
            className="map-control-button"
            aria-label="Acercar mapa"
            onClick={handleZoomIn}
          >
            <IconPlus size={16} stroke={1.5} />
          </button>
          <button
            type="button"
            className="map-control-button"
            aria-label="Alejar mapa"
            onClick={handleZoomOut}
          >
            <IconMinus size={16} stroke={1.5} />
          </button>
        </div>
        <div className="map-control-group">
          <button
            type="button"
            className="map-control-button"
            aria-label="Capas del mapa"
            title="Capas (usa el sidebar para activarlas)"
          >
            <IconLayersIntersect size={16} stroke={1.5} />
          </button>
        </div>
      </div>

      <div className="map-count-badge">
        <span className="map-count-badge__number">{alerts.length}</span>
        <span>{alerts.length === 1 ? 'alerta activa' : 'alertas activas'}</span>
      </div>

      <button type="button" className="map-center-btn" onClick={handleCenter}>
        <IconCurrentLocation size={14} stroke={1.5} />
        Mis zonas piloto
      </button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unusedRoot = createRoot; // silence unused if we wanted React-rendered popups

/**
 * Añade las capas estáticas (ríos, ANM, RAISG, polígonos de zonas piloto).
 * En esta primera iteración solo dibujamos los bounding boxes de las ROIs piloto
 * como referencia visible. Las capas reales se cargarán cuando estén
 * disponibles vía API.
 */
function addCustomLayers(map: mapboxgl.Map) {
  // Pilot zones (Caquetá + Inírida) como polígonos
  const pilotData: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Caquetá / Apaporis' },
        geometry: bboxToPolygon(ZONA_CAQUETA),
      },
      {
        type: 'Feature',
        properties: { name: 'Inírida' },
        geometry: bboxToPolygon(ZONA_INIRIDA),
      },
    ],
  };
  if (!map.getSource('fhg-pilot')) {
    map.addSource('fhg-pilot', { type: 'geojson', data: pilotData });
  }
  if (!map.getLayer('fhg-pilot-fill')) {
    map.addLayer({
      id: 'fhg-pilot-fill',
      type: 'fill',
      source: 'fhg-pilot',
      paint: {
        'fill-color': '#1A7A4A',
        'fill-opacity': 0.06,
      },
      layout: { visibility: 'visible' },
    });
  }
  if (!map.getLayer('fhg-pilot-line')) {
    map.addLayer({
      id: 'fhg-pilot-line',
      type: 'line',
      source: 'fhg-pilot',
      paint: {
        'line-color': '#1A7A4A',
        'line-width': 1,
        'line-dasharray': [3, 3],
        'line-opacity': 0.6,
      },
      layout: { visibility: 'visible' },
    });
  }
}

function bboxToPolygon(bbox: [[number, number], [number, number]]): GeoJSON.Polygon {
  const [[w, s], [e, n]] = bbox;
  return {
    type: 'Polygon',
    coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
  };
}

export { COLOR_FOR_LEVEL };
