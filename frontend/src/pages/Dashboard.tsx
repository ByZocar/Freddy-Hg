import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AlertMap from '../components/AlertMap';
import AlertPanel from '../components/AlertPanel';
import { useAlerts } from '../hooks/useAlerts';
import { supabase } from '../supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [confidenceMin, setConfidenceMin] = useState(1);
  const [indigenousOnly, setIndigenousOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = useMemo(() => ({ confidenceMin, indigenousOnly }), [confidenceMin, indigenousOnly]);
  const { alerts, loading, error } = useAlerts(filters);
  const selected = alerts.find((a) => a.id === selectedId) ?? null;

  async function handleExport(id: string) {
    window.open(`${BACKEND_URL}/api/export/pdf/${id}`, '_blank');
  }

  async function handleChangeState(id: string, state: string) {
    await fetch(`${BACKEND_URL}/api/alerts/${id}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
    alert(`Estado actualizado: ${state}`);
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">☿ Freddy Hg</div>
        <nav>
          <Link to="/admin">Admin</Link>
          <Link to="/public">Vista pública</Link>
          <button onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
        </nav>
      </header>

      <aside className="filters">
        <h3>Filtros</h3>
        <label>
          Confianza mínima
          <select value={confidenceMin} onChange={(e) => setConfidenceMin(Number(e.target.value))}>
            <option value={1}>1 — todas</option>
            <option value={2}>2 — relevantes</option>
            <option value={3}>3 — críticas</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={indigenousOnly}
            onChange={(e) => setIndigenousOnly(e.target.checked)}
          />
          Solo territorios indígenas
        </label>
        <div className="metrics">
          {loading ? 'Cargando…' : `${alerts.length} alertas`}
        </div>
        {error && <div className="error">⚠️ {error}</div>}
        <a href={`${BACKEND_URL}/api/alerts/export/geojson?confidence_min=${confidenceMin}`} className="export-link">
          Descargar GeoJSON
        </a>
        <a href={`${BACKEND_URL}/api/alerts/export/csv?confidence_min=${confidenceMin}`} className="export-link">
          Descargar CSV
        </a>
      </aside>

      <main className="map-area">
        <AlertMap alerts={alerts} onSelect={setSelectedId} />
        {selected && (
          <AlertPanel
            alert={selected}
            onClose={() => setSelectedId(null)}
            onExport={handleExport}
            onChangeState={handleChangeState}
          />
        )}
      </main>
    </div>
  );
}
