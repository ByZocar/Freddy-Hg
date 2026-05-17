/**
 * ☿ FREDDY Hg — Pipeline status
 * Calcula el estado del pipeline GEE basándose en la última alerta vista.
 * Si la última alerta fue hace >7 días: warning. Si >14 días: error.
 */
import { useMemo } from 'react';
import type { Alert } from './useAlerts';

export type PipelineStatusKind = 'safe' | 'running' | 'error';

export interface PipelineStatus {
  kind: PipelineStatusKind;
  label: string;
  lastScanAt: string | null;
}

export function usePipelineStatus(alerts: Alert[]): PipelineStatus {
  return useMemo(() => {
    if (!alerts || alerts.length === 0) {
      return { kind: 'error', label: 'GEE · Sin datos disponibles', lastScanAt: null };
    }
    const latest = alerts[0];
    const diffMs = Date.now() - new Date(latest.created_at).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 14) {
      return {
        kind: 'error',
        label: `GEE · Último scan hace ${diffDays}d`,
        lastScanAt: latest.created_at,
      };
    }
    if (diffDays > 7) {
      return {
        kind: 'running',
        label: `GEE · Último scan hace ${diffDays}d`,
        lastScanAt: latest.created_at,
      };
    }
    if (diffDays < 1) {
      return { kind: 'safe', label: 'GEE · Scan hoy', lastScanAt: latest.created_at };
    }
    return {
      kind: 'safe',
      label: `GEE · Último scan hace ${diffDays}d`,
      lastScanAt: latest.created_at,
    };
  }, [alerts]);
}
