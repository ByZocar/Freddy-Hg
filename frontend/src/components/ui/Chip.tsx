/**
 * ☿ FREDDY Hg — Chip
 * Filtros togglables (chips) usados en el sidebar.
 */
import type { ReactNode } from 'react';

type ChipTone = 'monitor' | 'warning' | 'critical' | 'safe';

interface Props {
  active?: boolean;
  tone?: ChipTone;
  onClick?: () => void;
  children: ReactNode;
  ariaLabel?: string;
}

export function Chip({
  active = false,
  tone = 'monitor',
  onClick,
  children,
  ariaLabel,
}: Props) {
  const classes = ['chip'];
  if (active) {
    classes.push('is-active');
    if (tone === 'critical') classes.push('chip--critical');
    if (tone === 'warning') classes.push('chip--warning');
  }
  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
