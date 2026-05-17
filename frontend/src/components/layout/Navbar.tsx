/**
 * ☿ FREDDY Hg — Navbar
 * Spec: FRONTEND_SPEC_COMPLETO.md § Pantalla 3 — Zona A.
 *
 * Estructura:
 *  - Izquierda: Wordmark + separador + nav links (Dashboard / Alertas / Público)
 *  - Centro: indicador de estado del pipeline GEE
 *  - Derecha: nombre de organización + bell + avatar usuario + dropdown
 */
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import {
  IconBell,
  IconBuilding,
  IconLogout,
  IconSettings,
} from '@tabler/icons-react';
import Wordmark from '../brand/Wordmark';
import { supabase } from '../../supabaseClient';
import { usePipelineStatus } from '../../hooks/usePipelineStatus';
import { useOrganization } from '../../hooks/useOrganization';
import { getInitials } from '../../lib/format';
import type { Alert } from '../../hooks/useAlerts';

interface Props {
  user: User | null;
  alerts: Alert[];
  unreadCount?: number;
}

export default function Navbar({ user, alerts, unreadCount = 0 }: Props) {
  const navigate = useNavigate();
  const pipeline = usePipelineStatus(alerts);
  const org = useOrganization(user);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const initials = getInitials(user?.user_metadata?.full_name as string | undefined ?? user?.email);
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Usuario';

  return (
    <header className="navbar dashboard__navbar" role="banner">
      <div className="navbar__left">
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <Wordmark variant="navbar" />
        </Link>

        <div className="divider divider--vertical" />

        <nav className="nav-links" aria-label="Navegación principal">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
            Admin
          </NavLink>
          <NavLink to="/public" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
            Público
          </NavLink>
        </nav>
      </div>

      <div className="navbar__center">
        <div className="pipeline-status" title={pipeline.lastScanAt ?? undefined}>
          <span className={`pipeline-status__dot pipeline-status__dot--${pipeline.kind}`} />
          <span>{pipeline.label}</span>
        </div>
      </div>

      <div className="navbar__right">
        <span className="navbar__org-name">
          {org.name} · {org.role}
        </span>

        <div className="divider divider--vertical" />

        <button
          type="button"
          className="notif-bell"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <IconBell size={18} stroke={1.5} />
          {unreadCount > 0 && (
            <span className="notif-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        <div ref={dropdownRef} className="dropdown">
          <button
            type="button"
            className="user-avatar"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Menú de usuario"
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="dropdown__menu" role="menu">
              <div className="dropdown__header">
                <div className="dropdown__name">{fullName}</div>
                <div className="dropdown__email">{user?.email}</div>
              </div>
              <button
                type="button"
                className="dropdown__item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
              >
                <IconSettings size={16} stroke={1.5} />
                Configuración
              </button>
              <button
                type="button"
                className="dropdown__item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings?tab=org');
                }}
              >
                <IconBuilding size={16} stroke={1.5} />
                Mi organización
              </button>
              <hr className="dropdown__divider" />
              <button
                type="button"
                className="dropdown__item dropdown__item--danger"
                role="menuitem"
                onClick={handleLogout}
              >
                <IconLogout size={16} stroke={1.5} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
