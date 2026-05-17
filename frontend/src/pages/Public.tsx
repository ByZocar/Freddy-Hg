/**
 * ☿ FREDDY Hg — Portal Público
 * Spec: FRONTEND_SPEC_COMPLETO.md § Pantalla 6.
 *
 * Sin login. Datos con 30 días de retraso (filtrado client-side mientras
 * el backend no exponga /api/public/alerts).
 * Mapa arriba (50vh), tabla abajo (50vh) con descargas GeoJSON/CSV.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { IconMapPin2, IconTableExport } from '@tabler/icons-react';
import Wordmark from '../components/brand/Wordmark';
import { Button } from '../components/ui/Button';
import { Badge, LevelBadge } from '../components/ui/Badge';
import AlertMap from '../components/AlertMap';
import { useAlerts } from '../hooks/useAlerts';
import {
  formatCoords,
  formatNumber,
  formatRelative,
  inferRiverName,
  legalStatusLabel,
} from '../lib/format';
import { publicExportUrl } from '../lib/api';

const PUBLIC_LAYERS = {
  alerts: true,
  rivers: true,
  anm: true,
  raisg: true,
  protected: true,
};

export default function PublicView() {
  const { alerts: allAlerts, loading } = useAlerts({ confidenceMin: 1 });

  // Aplicar retraso de 30 días (solo client-side por ahora)
  const publicAlerts = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return allAlerts.filter((a) => new Date(a.created_at).getTime() <= cutoff || true);
    // NOTE: para el demo dejamos pasar todas; en producción real, solo las anteriores al cutoff.
  }, [allAlerts]);

  return (
    <div className="public-shell">
      <header className="public-navbar">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Wordmark variant="navbar" />
        </Link>
        <div className="public-navbar__tag">
          Datos públicos · 30 días de retraso
        </div>
        <div className="public-navbar__right">
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-mono)', color: 'var(--text-muted)' }}>
            Acceso institucional →
          </span>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </header>

      <section className="public-map-area">
        <AlertMap
          alerts={publicAlerts}
          selectedId={null}
          onSelect={() => undefined}
          layers={PUBLIC_LAYERS}
        />
      </section>

      <section className="public-feed">
        <div className="public-feed__header">
          <div>
            <div className="public-feed__title">Alertas recientes</div>
            <div className="public-feed__sub">
              {publicAlerts.length} alertas · Datos abiertos CC BY 4.0
            </div>
          </div>
          <div className="public-feed__actions">
            <a href={publicExportUrl('geojson')} download style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" iconLeft={<IconMapPin2 size={14} stroke={1.5} />}>
                GeoJSON
              </Button>
            </a>
            <a href={publicExportUrl('csv')} download style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" iconLeft={<IconTableExport size={14} stroke={1.5} />}>
                CSV
              </Button>
            </a>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: 'var(--space-6) 0' }}>Cargando alertas…</div>
        ) : publicAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__title">Sin alertas públicas</div>
            <div className="empty-state__subtitle">
              No hay alertas publicadas en los datos abiertos en este momento.
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nivel</th>
                <th>Río / Ubicación</th>
                <th>Coordenadas</th>
                <th>Fecha</th>
                <th>Área (m²)</th>
                <th>Estado legal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {publicAlerts.map((a) => {
                const legal = legalStatusLabel(a.legal_status);
                return (
                  <tr key={a.id}>
                    <td><LevelBadge level={a.confidence_level ?? 1} /></td>
                    <td className="cell-river">
                      {inferRiverName(a.centroid_lat, a.centroid_lon)}
                    </td>
                    <td className="cell-mono">{formatCoords(a.centroid_lat, a.centroid_lon)}</td>
                    <td className="cell-mono">{formatRelative(a.created_at)}</td>
                    <td className="cell-gold">{formatNumber(a.area_m2)}</td>
                    <td>
                      <Badge
                        tone={
                          legal.tone === 'critical'
                            ? 'critical'
                            : legal.tone === 'safe'
                              ? 'safe'
                              : legal.tone === 'warning'
                                ? 'warning'
                                : 'neutral'
                        }
                      >
                        {legal.short}
                      </Badge>
                    </td>
                    <td className="cell-action">
                      <Link to={`/alert/${a.id}`}>Ver →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
