/**
 * ☿ FREDDY Hg — Badge
 * Mapea niveles 1/2/3 a tone monitor/warning/critical.
 */
import type { ReactNode } from 'react';

export type BadgeTone = 'critical' | 'warning' | 'monitor' | 'safe' | 'neutral' | 'gold-soft';

interface Props {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, icon, className = '' }: Props) {
  return (
    <span className={`badge badge--${tone} ${className}`.trim()}>
      {icon}
      {children}
    </span>
  );
}

const LEVEL_TO_TONE: Record<number, { tone: BadgeTone; label: string }> = {
  1: { tone: 'monitor', label: 'MONITOR' },
  2: { tone: 'warning', label: 'ADVERTENCIA' },
  3: { tone: 'critical', label: 'CRÍTICO' },
};

interface LevelProps {
  level: number;
  className?: string;
}

export function LevelBadge({ level, className }: LevelProps) {
  const config = LEVEL_TO_TONE[level] ?? LEVEL_TO_TONE[1];
  return (
    <Badge tone={config.tone} className={className}>
      {config.label}
    </Badge>
  );
}
