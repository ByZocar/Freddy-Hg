/**
 * ☿ FREDDY Hg — AlertCardItem
 * Card de alerta usada en el sidebar del dashboard.
 *
 * Estructura:
 *   Fila 1: badge nivel + río (izq) | tiempo relativo (der)
 *   Fila 2: coordenadas en mono
 *   Fila 3: 3 mini-stats (Hg ratio | personas | estado legal)
 */
import { LevelBadge } from '../ui/Badge';
import { Stat } from '../ui/Stat';
import type { Alert } from '../../hooks/useAlerts';
import {
  formatCoords,
  formatNumber,
  formatRelative,
  inferRiverName,
  legalStatusLabel,
  levelToTone,
} from '../../lib/format';

interface Props {
  alert: Alert;
  selected?: boolean;
  onClick: () => void;
}

export function AlertCardItem({ alert, selected = false, onClick }: Props) {
  const tone = levelToTone(alert.confidence_level);
  const river = inferRiverName(alert.centroid_lat, alert.centroid_lon);
  const legal = legalStatusLabel(alert.legal_status);
  const hgKg = alert.impact_metrics?.mercury_kg;
  const people = alert.impact_metrics?.people_at_risk;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`card--alert is-${tone}${selected ? ' is-selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKey}
      aria-label={`Alerta ${river} nivel ${alert.confidence_level}`}
    >
      <div className="alert-card-content__row1">
        <div className="alert-card-content__title-block">
          <LevelBadge level={alert.confidence_level ?? 1} />
          <span className="alert-card-content__river">{river}</span>
        </div>
        <span className="alert-card-content__time">{formatRelative(alert.created_at)}</span>
      </div>

      <div className="alert-card-content__coords">
        {formatCoords(alert.centroid_lat, alert.centroid_lon)}
      </div>

      <div className="alert-card-content__stats">
        <Stat
          value={hgKg !== undefined && hgKg !== null ? `${formatNumber(hgKg)}kg` : '—'}
          label="Hg"
          tone={tone === 'critical' ? 'critical' : 'warning'}
          size="xs"
        />
        <Stat
          value={people !== undefined && people !== null ? formatNumber(people) : '—'}
          label="Personas"
          tone="gold"
          size="xs"
        />
        <Stat
          value={legal.short}
          label="Concesión"
          tone={
            legal.tone === 'critical'
              ? 'critical'
              : legal.tone === 'safe'
                ? 'safe'
                : legal.tone === 'warning'
                  ? 'warning'
                  : 'silver'
          }
          size="xs"
        />
      </div>
    </div>
  );
}
