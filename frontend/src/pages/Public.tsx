import { useEffect, useState } from 'react';
import AlertMap from '../components/AlertMap';
import type { Alert } from '../hooks/useAlerts';
import { supabase } from '../supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function PublicView() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('public_alerts').select('*').limit(500);
      setAlerts((data ?? []) as Alert[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="public-view">
      <header className="topbar">
        <div className="brand">☿ Freddy Hg — Vista pública</div>
        <nav>
          <a href="/login">Acceso CAR/ONG</a>
        </nav>
      </header>

      <div className="public-banner">
        <strong>Vista pública para periodistas e investigadores.</strong>{' '}
        Alertas con &gt;30 días desde detección y confianza ≥ 2. Datos bajo Apache 2.0.
        <div className="downloads">
          <a href={`${BACKEND_URL}/api/alerts/export/geojson?confidence_min=2`}>
            Descargar GeoJSON
          </a>
          <a href={`${BACKEND_URL}/api/alerts/export/csv?confidence_min=2`}>
            Descargar CSV
          </a>
        </div>
      </div>

      <main className="map-area public">
        {loading ? <p>Cargando…</p> : <AlertMap alerts={alerts} onSelect={() => {}} />}
      </main>
    </div>
  );
}
