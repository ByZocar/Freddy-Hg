/**
 * ☿ FREDDY Hg — Sidebar (Dashboard)
 * Spec: FRONTEND_SPEC_COMPLETO.md § Pantalla 3 — Zona B.
 */
import { useMemo } from 'react';
import {
  IconAlertTriangle,
  IconFileCertificate,
  IconSatellite,
  IconSearch,
  IconTree,
  IconUsers,
  IconWaveSawTool,
  IconX,
} from '@tabler/icons-react';
import { Input } from '../ui/Input';
import { Chip } from '../ui/Chip';
import { Toggle } from '../ui/Toggle';
import { SectionLabel } from '../ui/Card';
import { AlertCardItem } from './AlertCardItem';
import type { Alert } from '../../hooks/useAlerts';

export type DateRange = '24h' | '7d' | '30d' | 'all';
export type LevelFilter = 'all' | 'critical' | 'warning' | 'monitor';

export interface LayerToggles {
  alerts: boolean;
  rivers: boolean;
  anm: boolean;
  raisg: boolean;
  protected: boolean;
}

interface Props {
  alerts: Alert[];
  totalAlerts: number;
  search: string;
  onSearchChange: (value: string) => void;
  levelFilter: LevelFilter;
  onLevelFilterChange: (value: LevelFilter) => void;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  selectedId: string | null;
  onSelectAlert: (id: string) => void;
  layers: LayerToggles;
  onLayersChange: (layers: LayerToggles) => void;
}

const LAYER_DEFS: Array<{
  key: keyof LayerToggles;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    key: 'alerts',
    label: 'Alertas activas',
    icon: <IconAlertTriangle size={16} stroke={1.5} color="#D4380A" />,
    color: '#D4380A',
  },
  {
    key: 'rivers',
    label: 'Ríos (HydroSHEDS)',
    icon: <IconWaveSawTool size={16} stroke={1.5} color="#2A5A8A" />,
    color: '#2A5A8A',
  },
  {
    key: 'anm',
    label: 'Concesiones ANM',
    icon: <IconFileCertificate size={16} stroke={1.5} color="#4A8AB0" />,
    color: '#4A8AB0',
  },
  {
    key: 'raisg',
    label: 'Resguardos indígenas',
    icon: <IconUsers size={16} stroke={1.5} color="#A0A0A0" />,
    color: '#A0A0A0',
  },
  {
    key: 'protected',
    label: 'Áreas protegidas',
    icon: <IconTree size={16} stroke={1.5} color="#1A7A4A" />,
    color: '#1A7A4A',
  },
];

const DATE_OPTIONS: Array<{ value: DateRange; label: string }> = [
  { value: '24h', label: 'Últimas 24h' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'all', label: 'Todo el historial' },
];

export default function Sidebar({
  alerts,
  totalAlerts,
  search,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
  dateRange,
  onDateRangeChange,
  selectedId,
  onSelectAlert,
  layers,
  onLayersChange,
}: Props) {
  const visibleAlerts = useMemo(() => alerts, [alerts]);

  const setLayer = (key: keyof LayerToggles, value: boolean) => {
    onLayersChange({ ...layers, [key]: value });
  };

  return (
    <aside className="dashboard__sidebar" aria-label="Filtros y lista de alertas">
      <div className="sidebar-header">
        <Input
          size="sm"
          mono
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por río o coordenadas"
          iconLeft={<IconSearch size={14} stroke={1.5} />}
          iconRight={
            search.length > 0 ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Limpiar búsqueda"
                style={{ display: 'inline-flex', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                <IconX size={12} stroke={1.5} />
              </button>
            ) : undefined
          }
        />

        <div className="sidebar-chips">
          <Chip active={levelFilter === 'all'} onClick={() => onLevelFilterChange('all')}>
            Todos
          </Chip>
          <Chip
            active={levelFilter === 'critical'}
            tone="critical"
            onClick={() => onLevelFilterChange('critical')}
          >
            Crítico
          </Chip>
          <Chip
            active={levelFilter === 'warning'}
            tone="warning"
            onClick={() => onLevelFilterChange('warning')}
          >
            Advertencia
          </Chip>
          <Chip active={levelFilter === 'monitor'} onClick={() => onLevelFilterChange('monitor')}>
            Monitor
          </Chip>
        </div>

        <div className="field">
          <label className="field__label">Período</label>
          <select
            className="input input--sm"
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value as DateRange)}
          >
            {DATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr className="divider divider--subtle" />

      <div className="sidebar-section-header">
        <SectionLabel>Alertas activas · {totalAlerts}</SectionLabel>
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="sidebar-empty">
          <IconSatellite size={32} stroke={1.5} className="sidebar-empty__icon" />
          <div className="sidebar-empty__title">Sin alertas en el período seleccionado.</div>
          <div className="sidebar-empty__sub">El pipeline SAR corre cada 6 días.</div>
        </div>
      ) : (
        <div className="sidebar-list">
          {visibleAlerts.map((alert) => (
            <AlertCardItem
              key={alert.id}
              alert={alert}
              selected={alert.id === selectedId}
              onClick={() => onSelectAlert(alert.id)}
            />
          ))}
        </div>
      )}

      <div className="sidebar-layers">
        <SectionLabel>Capas del mapa</SectionLabel>
        <div className="sidebar-layers__list" style={{ marginTop: 'var(--space-2)' }}>
          {LAYER_DEFS.map((layer) => (
            <div key={layer.key} className="sidebar-layer">
              <span className="sidebar-layer__label">
                {layer.icon}
                {layer.label}
              </span>
              <Toggle
                checked={layers[layer.key]}
                onChange={(v) => setLayer(layer.key, v)}
                ariaLabel={`Mostrar capa ${layer.label}`}
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
