/**
 * ☿ FREDDY Hg — Toggle switch
 * Patrón checkbox accesible con apariencia de switch dorado.
 */
import type { ChangeEvent } from 'react';
import { useId } from 'react';

interface Props {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  ariaLabel?: string;
}

export function Toggle({ checked, onChange, label, ariaLabel }: Props) {
  const id = useId();
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked);

  return (
    <label
      htmlFor={id}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span className="toggle">
        <input
          id={id}
          type="checkbox"
          className="toggle__input"
          checked={checked}
          onChange={handleChange}
          aria-label={ariaLabel ?? label}
        />
        <span className="toggle__track" />
        <span className="toggle__thumb" />
      </span>
      {label && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--fs-body)',
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
}
