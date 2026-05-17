/**
 * ☿ FREDDY Hg — Toast system
 * Provee `useToast()` para emitir notificaciones (success/error/info).
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { IconCheck, IconAlertCircle, IconLoader2, IconX } from '@tabler/icons-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  duration?: number;
}

interface ToastCtxValue {
  push: (tone: ToastTone, message: string, duration?: number) => void;
  success: (msg: string, duration?: number) => void;
  error: (msg: string, duration?: number) => void;
  info: (msg: string, duration?: number) => void;
}

const ToastCtx = createContext<ToastCtxValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback((tone: ToastTone, message: string, duration?: number) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, tone, message, duration }].slice(-3));
    const ttl = duration ?? (tone === 'error' ? 6000 : 4000);
    if (ttl > 0) {
      const timer = setTimeout(() => remove(id), ttl);
      timersRef.current.set(id, timer);
    }
  }, [remove]);

  const value: ToastCtxValue = {
    push,
    success: (msg, d) => push('success', msg, d),
    error: (msg, d) => push('error', msg, d),
    info: (msg, d) => push('info', msg, d ?? 0),
  };

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`} role="status">
            <span className="toast__icon">
              {t.tone === 'success' && <IconCheck size={16} stroke={2} />}
              {t.tone === 'error' && <IconAlertCircle size={16} stroke={1.5} />}
              {t.tone === 'info' && <IconLoader2 size={16} stroke={1.5} />}
            </span>
            <span className="toast__msg">{t.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => remove(t.id)}
              aria-label="Cerrar notificación"
            >
              <IconX size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastCtxValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider />');
  }
  return ctx;
}
