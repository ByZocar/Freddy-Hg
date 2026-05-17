import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { Alert } from '../hooks/useAlerts';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('alerts')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setAlert(data as Alert | null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="loading-screen">Cargando alerta…</div>;
  if (!alert) return <div className="loading-screen">Alerta no encontrada.</div>;

  return (
    <div className="alert-detail-page">
      <Link to="/dashboard">← Volver al mapa</Link>
      <h1>Alerta {alert.id.slice(0, 8)}</h1>
      <table>
        <tbody>
          <tr><th>Escena Sentinel-1</th><td>{alert.scene_id}</td></tr>
          <tr><th>Fecha UTC</th><td>{alert.scene_date_utc}</td></tr>
          <tr><th>Coordenadas</th><td>{alert.centroid_lat.toFixed(6)}, {alert.centroid_lon.toFixed(6)}</td></tr>
          <tr><th>Nivel</th><td>{alert.confidence_level} / 3</td></tr>
          <tr><th>Estado legal</th><td>{alert.legal_status}</td></tr>
          <tr><th>Resguardo</th><td>{alert.indigenous_territory || '—'}</td></tr>
          <tr><th>SHA-256</th><td className="sha256">{alert.sha256_evidence}</td></tr>
        </tbody>
      </table>
      <a
        href={`${BACKEND_URL}/api/export/pdf/${alert.id}`}
        target="_blank"
        className="primary"
        rel="noreferrer"
      >
        📄 Exportar informe técnico
      </a>
    </div>
  );
}
