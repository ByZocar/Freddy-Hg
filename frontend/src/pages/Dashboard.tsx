/**
 * ☿ FREDDY Hg — Dashboard
 * Spec: FRONTEND_SPEC_COMPLETO.md § Pantalla 3 (layout 3 zonas).
 */
import { useEffect, useMemo, useState } from 'react';
import { IconSatellite } from '@tabler/icons-react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import type { DateRange, LayerToggles, LevelFilter } from '../components/layout/Sidebar';
import AlertMap from '../components/AlertMap';
import AlertPanel from '../components/AlertPanel';
import { useAlerts } from '../hooks/useAlerts';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { downloadPdf, updateAlertState } from '../lib/api';

const DEFAULT_LAYERS: LayerToggles = {
  alerts: true,
  rivers: true,
  anm: true,
  raisg: true,
  protected: true,
};

function levelMatch(level: number | null, filter: LevelFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'critical') return level === 3;
  if (filter === 'warning') return level === 2;
  if (filter === 'monitor') return level === 1;
  return true;
}

function withinDateRange(createdAt: string, range: DateRange): boolean {
  if (range === 'all') return true;
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (range === '24h') return diffDays <= 1;
  if (range === '7d') return diffDays <= 7;
  if (range === '30d') return diffDays <= 30;
  return true;
}

function searchMatch(query: string, alert: { centroid_lat: number; centroid_lon: number }): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  const coords = `${alert.centroid_lat.toFixed(4)} ${alert.centroid_lon.toFixed(4)}`;
  return coords.includes(q) || q === '';
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const { alerts: allAlerts, loading, error } = useAlerts({ confidenceMin: 1 });
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerToggles>(DEFAULT_LAYERS);
  const [stateById, setStateById] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return allAlerts.filter(
      (a) =>
        levelMatch(a.confidence_level, levelFilter) &&
        withinDateRange(a.created_at, dateRange) &&
        searchMatch(search, a),
    );
  }, [allAlerts, levelFilter, dateRange, search]);

  const selected = useMemo(
    () => (selectedId ? allAlerts.find((a) => a.id === selectedId) ?? null : null),
    [selectedId, allAlerts],
  );

  // Reset selection si la alerta seleccionada deja de existir en el filtrado
  useEffect(() => {
    if (selectedId && !filtered.find((a) => a.id === selectedId)) {
      // permanece visible aunque esté fuera del filtro — el usuario debe poder cerrarla
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (error) toast.error(`No se pudieron cargar las alertas: ${error}`);
  }, [error, toast]);

  const handleExport = async (id: string) => {
    toast.info('Generando PDF…');
    try {
      const blob = await downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `freddy_hg_alerta_${id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF descargado');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleChangeState = async (id: string, state: string) => {
    try {
      await updateAlertState(id, state);
      setStateById((prev) => ({ ...prev, [id]: state }));
      toast.success(`Estado actualizado a "${state.replace(/_/g, ' ')}"`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="dashboard">
      <Navbar user={user} alerts={allAlerts} />
      <Sidebar
        alerts={filtered}
        totalAlerts={filtered.length}
        search={search}
        onSearchChange={setSearch}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedId={selectedId}
        onSelectAlert={setSelectedId}
        layers={layers}
        onLayersChange={setLayers}
      />
      <main className="dashboard__main">
        <AlertMap
          alerts={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          layers={layers}
        />

        {!loading && filtered.length === 0 && (
          <div className="map-empty-overlay">
            <IconSatellite size={48} stroke={1.5} style={{ color: 'var(--text-muted)' }} />
            <div
              className="font-display"
              style={{
                fontSize: 'var(--fs-h2)',
                color: 'var(--text-primary)',
              }}
            >
              Sin alertas detectadas
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-body)' }}>
              No hay candidatos del pipeline SAR en el rango y filtros seleccionados.
            </div>
            <div className="font-mono" style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
              PIPELINE_DAYS_BACK · BACKSCATTER_THRESHOLD · MIN_PIXELS configurables
            </div>
          </div>
        )}

        {selected && (
          <AlertPanel
            alert={selected}
            onClose={() => setSelectedId(null)}
            onExport={handleExport}
            onChangeState={handleChangeState}
            currentState={stateById[selected.id] ?? 'nuevo'}
          />
        )}
      </main>
    </div>
  );
}
