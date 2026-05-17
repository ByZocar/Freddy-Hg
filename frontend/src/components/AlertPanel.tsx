/**
 * ☿ FREDDY Hg — AlertPanel (deslizable derecho)
 * Spec: FRONTEND_SPEC_COMPLETO.md § Pantalla 4.
 *
 * Secciones (top → bottom):
 *  1. Card de mapa SAR + grid 2x2 de datos + coords/scene
 *  2. Indigenous territory warning (condicional)
 *  3. Mistral AI context
 *  4. Impacto estimado (3 stats)
 *  5. SHA-256
 *  6. Selector de estado
 *  Footer: PDF + Ver completa
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconFileDownload,
  IconInfoCircle,
  IconSatellite,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { Badge, LevelBadge } from './ui/Badge';
import { Stat } from './ui/Stat';
import { Button } from './ui/Button';
import { SectionLabel } from './ui/Card';
import { useToast } from '../hooks/useToast';
import type { Alert } from '../hooks/useAlerts';
import {
  formatCoords,
  formatHumanUTC,
  formatNumber,
  formatUSD,
  inferRiverName,
  legalStatusLabel,
} from '../lib/format';

interface Props {
  alert: Alert;
  onClose: () => void;
  onExport: (id: string) => void;
  onChangeState: (id: string, state: string) => void;
  currentState?: string;
}

const STATES: Array<{ value: string; label: string; cls?: string }> = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'revisando', label: 'Revisando' },
  { value: 'en_campo', label: 'En campo', cls: 'state-button--field' },
  { value: 'medida_cautelar', label: 'Medida cautelar', cls: 'state-button--cautelar' },
  { value: 'archivado', label: 'Archivado', cls: 'state-button--archived' },
];

export default function AlertPanel({
  alert,
  onClose,
  onExport,
  onChangeState,
  currentState = 'nuevo',
}: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [exporting, setExporting] = useState(false);

  const river = inferRiverName(alert.centroid_lat, alert.centroid_lon);
  const legal = legalStatusLabel(alert.legal_status);

  // ESC para cerrar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const copy = async (text: string, target: 'coords' | 'hash') => {
    try {
      await navigator.clipboard.writeText(text);
      if (target === 'coords') {
        setCopiedCoords(true);
        setTimeout(() => setCopiedCoords(false), 1500);
      } else {
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 1500);
      }
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport(alert.id);
    } finally {
      setExporting(false);
    }
  };

  const hgKg = alert.impact_metrics?.mercury_kg;
  const damageUsd = alert.impact_metrics?.damage_usd;
  const peopleAtRisk = alert.impact_metrics?.people_at_risk;

  return (
    <aside className="alert-panel" role="dialog" aria-label="Detalle de alerta">
      <header className="alert-panel__header">
        <div className="alert-panel__header-left">
          <LevelBadge level={alert.confidence_level ?? 1} />
          <span className="alert-panel__river">{river}</span>
        </div>
        <button
          type="button"
          className="alert-panel__close"
          onClick={onClose}
          aria-label="Cerrar panel"
        >
          <IconX size={18} stroke={1.5} />
        </button>
      </header>

      <div className="alert-panel__body">
        {/* Sección 1: mapa estático + grid datos + coordenadas */}
        <div className="alert-panel__map">
          <div className="alert-panel__map-placeholder">
            <IconSatellite size={24} stroke={1.5} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              Vista SAR no disponible
            </span>
          </div>
          <div className="alert-panel__map-tag">SENTINEL-1 SAR</div>
        </div>

        <div className="alert-panel__stats-grid">
          <Stat
            value={legal.short}
            label="Estado ANM"
            tone={legal.tone === 'critical' ? 'critical' : legal.tone === 'safe' ? 'safe' : 'gold'}
            size="md"
          />
          <Stat
            value={`NIVEL ${alert.confidence_level ?? 1}`}
            label="Confianza SAR"
            tone="gold"
            size="md"
          />
          <Stat
            value={alert.area_m2 !== null ? `${formatNumber(alert.area_m2)}` : '—'}
            unit="m²"
            label="Área detectada"
            tone="gold"
            size="md"
          />
          <Stat
            value={hgKg !== null && hgKg !== undefined ? formatNumber(hgKg) : '—'}
            unit="kg"
            label="Hg estimado (proxy)"
            tone={hgKg && hgKg > 100 ? 'critical' : 'gold'}
            size="md"
          />
        </div>

        <div className="card card--md card--inset" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div className="alert-panel__data-row">
            <span className="alert-panel__data-row-mono">
              {formatCoords(alert.centroid_lat, alert.centroid_lon, 4)}
            </span>
            <button
              type="button"
              onClick={() =>
                copy(`${alert.centroid_lat}, ${alert.centroid_lon}`, 'coords')
              }
              aria-label="Copiar coordenadas"
              className="hash-box__copy"
              style={{ color: copiedCoords ? 'var(--text-safe)' : 'var(--text-muted)' }}
            >
              {copiedCoords ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} stroke={1.5} />}
            </button>
          </div>
          <div className="alert-panel__data-meta text-truncate" title={alert.scene_id}>
            Escena: {alert.scene_id}
          </div>
          <div className="alert-panel__data-meta">
            UTC: {formatHumanUTC(alert.scene_date_utc)}
          </div>
        </div>

        {/* Sección 2: territorio indígena (condicional) */}
        {alert.indigenous_territory && (
          <div className="indigenous-box">
            <span className="indigenous-box__icon">
              <IconUsers size={18} stroke={1.5} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="indigenous-box__title">Territorio indígena afectado</div>
              <div className="indigenous-box__name">
                {alert.indigenous_territory}
                {alert.indigenous_nation ? ` · ${alert.indigenous_nation}` : ''}
              </div>
              {alert.requires_ddhh_protocol && (
                <div className="indigenous-box__hint">
                  Protocolo de derechos humanos activado (T-106/25)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sección 3: contexto Mistral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <SectionLabel
            trailing={<Badge tone="gold-soft">Mistral AI</Badge>}
          >
            Análisis de contexto
          </SectionLabel>
          <div className="mistral-block">
            {alert.mistral_context
              ? alert.mistral_context
              : 'Contexto no disponible para esta alerta.'}
          </div>
        </div>

        {/* Sección 4: impacto estimado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <SectionLabel
            trailing={
              <span
                title="Valores calculados con metodología proxy (Marrugo-Negrete 2019). No usar como dato oficial."
                style={{ display: 'inline-flex', color: 'var(--text-muted)', cursor: 'help' }}
              >
                <IconInfoCircle size={12} stroke={1.5} />
              </span>
            }
          >
            Impacto estimado (proxy)
          </SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
            <Stat
              value={hgKg !== null && hgKg !== undefined ? formatNumber(hgKg) : '—'}
              unit="kg"
              label="Hg estimado"
              tone={hgKg && hgKg > 100 ? 'critical' : 'gold'}
              size="md"
            />
            <Stat
              value={damageUsd !== null && damageUsd !== undefined ? formatUSD(damageUsd) : '—'}
              label="Costo remediación"
              tone="gold"
              size="md"
            />
            <Stat
              value={
                peopleAtRisk !== null && peopleAtRisk !== undefined
                  ? formatNumber(peopleAtRisk)
                  : '—'
              }
              label="Aguas abajo 50km"
              tone="gold"
              size="md"
            />
          </div>
        </div>

        {/* Sección 5: SHA-256 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <SectionLabel>Cadena de custodia digital</SectionLabel>
          <div className="hash-box">
            <span className="hash-box__value">{alert.sha256_evidence}</span>
            <button
              type="button"
              className={`hash-box__copy${copiedHash ? ' is-copied' : ''}`}
              onClick={() => copy(alert.sha256_evidence, 'hash')}
              aria-label="Copiar hash SHA-256"
            >
              {copiedHash ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} stroke={1.5} />}
            </button>
          </div>
        </div>

        {/* Sección 6: selector de estado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <SectionLabel>Estado del caso</SectionLabel>
          <div className="alert-panel__states">
            {STATES.map((s) => {
              const isActive = currentState === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  className={`state-button${isActive ? ' is-active' : ''}${s.cls ? ` ${s.cls}` : ''}`}
                  onClick={() => onChangeState(alert.id, s.value)}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="alert-panel__footer">
        <Button
          variant="primary"
          loading={exporting}
          onClick={handleExport}
          iconLeft={<IconFileDownload size={16} stroke={1.5} />}
        >
          Exportar PDF
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate(`/alert/${alert.id}`)}
          iconRight={<IconExternalLink size={14} stroke={1.5} />}
        >
          Ver completa
        </Button>
      </footer>
    </aside>
  );
}
