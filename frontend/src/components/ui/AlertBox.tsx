/**
 * ☿ FREDDY Hg — AlertBox
 * Banners de aviso inline (info, warning, critical).
 */
import type { ReactNode } from 'react';
import { IconAlertTriangle, IconInfoCircle, IconAlertOctagon } from '@tabler/icons-react';

type Tone = 'info' | 'warning' | 'critical';

interface Props {
  tone?: Tone;
  title?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
}

const DEFAULT_ICONS: Record<Tone, ReactNode> = {
  info: <IconInfoCircle size={18} stroke={1.5} />,
  warning: <IconAlertTriangle size={18} stroke={1.5} />,
  critical: <IconAlertOctagon size={18} stroke={1.5} />,
};

export function AlertBox({ tone = 'info', title, children, icon }: Props) {
  return (
    <div className={`alert-box alert-box--${tone}`} role="alert">
      <span className="alert-box__icon">{icon ?? DEFAULT_ICONS[tone]}</span>
      <div className="alert-box__content">
        {title && <div className="alert-box__title">{title}</div>}
        {children}
      </div>
    </div>
  );
}
