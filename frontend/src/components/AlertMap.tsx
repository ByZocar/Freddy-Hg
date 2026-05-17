import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Alert } from '../hooks/useAlerts';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface Props {
  alerts: Alert[];
  onSelect: (id: string) => void;
}

const COLOR_BY_LEVEL: Record<number, string> = {
  1: '#fbc02d',
  2: '#e64a19',
  3: '#b71c1c',
};

export default function AlertMap({ alerts, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-71.0, 1.0],
      zoom: 5.2,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    for (const a of alerts) {
      const el = document.createElement('div');
      el.className = 'alert-marker';
      el.style.background = COLOR_BY_LEVEL[a.confidence_level ?? 1];
      el.style.width = `${10 + (a.confidence_level ?? 1) * 4}px`;
      el.style.height = `${10 + (a.confidence_level ?? 1) * 4}px`;
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 0 6px rgba(0,0,0,0.6)';
      el.title = `Nivel ${a.confidence_level} - ${a.legal_status ?? ''}`;
      el.addEventListener('click', () => onSelect(a.id));
      const marker = new mapboxgl.Marker(el)
        .setLngLat([a.centroid_lon, a.centroid_lat])
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    }
  }, [alerts, onSelect]);

  return <div ref={containerRef} className="alert-map" />;
}
