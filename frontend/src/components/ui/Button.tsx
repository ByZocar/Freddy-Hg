/**
 * ☿ FREDDY Hg — Button
 * Variantes: primary, ghost, danger
 * Tamaños: sm, md (default), lg
 * Soporta estado loading con spinner interno.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  iconLeft,
  iconRight,
  disabled,
  children,
  className = '',
  ...rest
}: Props) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button {...rest} disabled={disabled || loading} className={classes}>
      {loading ? (
        <>
          <span className="btn__spinner" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {iconLeft}
          {children}
          {iconRight}
        </>
      )}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  ariaLabel: string;
  children: ReactNode;
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  ariaLabel,
  children,
  className = '',
  ...rest
}: IconButtonProps) {
  const classes = [
    'btn',
    'btn--icon',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button {...rest} aria-label={ariaLabel} className={classes}>
      {children}
    </button>
  );
}
