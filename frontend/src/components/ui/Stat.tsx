/**
 * ☿ FREDDY Hg — Stat
 * Métrica numérica con valor + label + tono semántico opcional.
 */
import type { ReactNode } from 'react';

export type StatTone = 'gold' | 'critical' | 'warning' | 'safe' | 'silver';
export type StatSize = 'xs' | 'sm' | 'md' | 'lg';

interface Props {
  value: ReactNode;
  label: string;
  unit?: string;
  tone?: StatTone;
  size?: StatSize;
  className?: string;
}

export function Stat({
  value,
  label,
  unit,
  tone = 'gold',
  size = 'sm',
  className = '',
}: Props) {
  const valueClasses = [
    'stat__value',
    tone === 'critical' && 'stat__value--critical',
    tone === 'warning' && 'stat__value--warning',
    tone === 'safe' && 'stat__value--safe',
    tone === 'silver' && 'stat__value--silver',
  ]
    .filter(Boolean)
    .join(' ');

  const containerClasses = [
    'stat',
    size === 'xs' && 'stat--xs',
    size === 'md' && 'stat--md',
    size === 'lg' && 'stat--lg',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <div className={valueClasses}>
        {value}
        {unit && <span className="stat__value-unit">{unit}</span>}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  );
}
