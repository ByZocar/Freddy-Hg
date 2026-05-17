/**
 * ☿ FREDDY Hg — Card
 * Contenedor estándar con variantes de superficie.
 */
import type { ReactNode, HTMLAttributes } from 'react';

type CardSurface = 'default' | 'surface-1' | 'surface-3' | 'inset';
type CardSize = 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface;
  size?: CardSize;
  children: ReactNode;
}

export function Card({
  surface = 'default',
  size = 'lg',
  children,
  className = '',
  ...rest
}: CardProps) {
  const classes = [
    'card',
    size === 'md' && 'card--md',
    size === 'sm' && 'card--sm',
    surface === 'surface-1' && 'card--surface-1',
    surface === 'surface-3' && 'card--surface-3',
    surface === 'inset' && 'card--inset',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div {...rest} className={classes}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  trailing,
}: {
  title?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="card__header">
      {title && <div className="card__title">{title}</div>}
      {trailing}
    </div>
  );
}

export function CardDivider() {
  return <hr className="card__divider" />;
}

export function Divider({ subtle = false }: { subtle?: boolean }) {
  return <hr className={`divider${subtle ? ' divider--subtle' : ''}`} />;
}

export function SectionLabel({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="section-label">
      <span>{children}</span>
      {trailing}
    </div>
  );
}
