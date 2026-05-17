/**
 * ☿ FREDDY Hg — Input + Field
 * Input estándar con soporte para íconos izquierda/derecha, label en mono,
 * mensajes de error, variante mono para datos técnicos.
 */
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId, forwardRef } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <div className="field">
      {label && <label className="field__label">{label}</label>}
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && (
        <span className="field__error">
          <IconAlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  mono?: boolean;
  hasError?: boolean;
  size?: 'sm' | 'md';
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    iconLeft,
    iconRight,
    mono = false,
    hasError = false,
    size = 'md',
    className = '',
    ...rest
  },
  ref,
) {
  const classes = [
    'input',
    mono && 'input--mono',
    hasError && 'input--error',
    iconLeft && 'input--with-icon-left',
    iconRight && 'input--with-icon-right',
    size === 'sm' && 'input--sm',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (!iconLeft && !iconRight) {
    return <input ref={ref} {...rest} className={classes} />;
  }

  return (
    <div className="input-wrapper">
      {iconLeft && <span className="input-wrapper__icon-left">{iconLeft}</span>}
      <input ref={ref} {...rest} className={classes} />
      {iconRight && <span className="input-wrapper__icon-right">{iconRight}</span>}
    </div>
  );
});

interface LabeledInputProps extends InputProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function LabeledInput({ label, hint, error, ...inputProps }: LabeledInputProps) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error}>
      <Input id={id} hasError={Boolean(error)} {...inputProps} />
    </Field>
  );
}
