/**
 * ☿ FREDDY Hg — Configuración
 * Spec: FRONTEND_SPEC_COMPLETO.md § Pantalla 9.
 *
 * 4 tabs: Mi cuenta · Mi organización · Zonas monitoreadas · Notificaciones.
 * El primer release implementa el chasis completo; los handlers de guardado
 * son placeholders que solo emiten toast (se conectan al backend en V1.1).
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, SectionLabel } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { LabeledInput, Field } from '../components/ui/Input';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useAlerts } from '../hooks/useAlerts';
import { useOrganization } from '../hooks/useOrganization';
import { useToast } from '../hooks/useToast';
import { supabase } from '../supabaseClient';

type TabKey = 'account' | 'org' | 'zones' | 'notifications';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'account', label: 'Mi cuenta' },
  { key: 'org', label: 'Mi organización' },
  { key: 'zones', label: 'Zonas monitoreadas' },
  { key: 'notifications', label: 'Notificaciones' },
];

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey | null) ?? 'account';
  const [tab, setTab] = useState<TabKey>(initialTab);
  const { user } = useAuth();
  const { alerts } = useAlerts({ confidenceMin: 1 });
  const org = useOrganization(user);
  const toast = useToast();

  useEffect(() => {
    setSearchParams({ tab }, { replace: true });
  }, [tab, setSearchParams]);

  return (
    <div className="page-shell">
      <Navbar user={user} alerts={alerts} />
      <div className="page-shell__body">
        <div className="admin-page">
          <h1 className="admin-page__title">Configuración</h1>

          <nav className="settings-tabs" role="tablist" style={{ marginTop: 'var(--space-6)' }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={`settings-tab${tab === t.key ? ' is-active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {tab === 'account' && <AccountTab user={user} onSaved={() => toast.success('Cambios guardados')} />}
          {tab === 'org' && <OrgTab org={org} />}
          {tab === 'zones' && <ZonesTab />}
          {tab === 'notifications' && (
            <NotificationsTab onSaved={() => toast.success('Preferencias guardadas')} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Mi cuenta ─────────────────────────────────────────── */
function AccountTab({
  user,
  onSaved,
}: {
  user: ReturnType<typeof useAuth>['user'];
  onSaved: () => void;
}) {
  const toast = useToast();
  const [fullName, setFullName] = useState(
    (user?.user_metadata?.full_name as string | undefined) ?? '',
  );
  const [role, setRole] = useState(
    (user?.user_metadata?.role as string | undefined) ?? '',
  );

  const has2FA = Boolean(user?.factors && user.factors.length > 0);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, role },
    });
    if (error) toast.error(error.message);
    else onSaved();
  };

  return (
    <div className="settings-section">
      <SectionLabel>Información de perfil</SectionLabel>
      <Card>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <LabeledInput
            label="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="María Rodríguez"
          />
          <LabeledInput
            label="Correo electrónico"
            value={user?.email ?? ''}
            disabled
            hint="Para cambiar el correo, contacta al administrador."
          />
          <LabeledInput
            label="Cargo"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Profesional especializado de Control Ambiental"
          />
          <Button type="submit" variant="primary">
            Guardar cambios
          </Button>
        </form>
      </Card>

      <SectionLabel>Verificación en dos pasos</SectionLabel>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body-lg)', color: 'var(--text-primary)' }}>
              Autenticación TOTP
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: 4 }}>
              {has2FA
                ? 'Tu cuenta está protegida con código de seis dígitos.'
                : 'Esta plataforma contiene ubicaciones sensibles. Activa 2FA para protegerlas.'}
            </div>
          </div>
          <Badge tone={has2FA ? 'safe' : 'critical'}>
            {has2FA ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <hr className="card__divider" />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {has2FA ? (
            <Button variant="ghost">Regenerar código</Button>
          ) : (
            <Button variant="primary">Activar 2FA</Button>
          )}
        </div>
      </Card>

      <SectionLabel>Sesión actual</SectionLabel>
      <Card size="md" surface="surface-1">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
          Sesión iniciada · Última actividad: ahora
        </div>
        <div style={{ marginTop: 'var(--space-3)' }}>
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
          >
            Cerrar esta sesión
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Tab: Mi organización ───────────────────────────────────── */
function OrgTab({ org }: { org: ReturnType<typeof useOrganization> }) {
  return (
    <div className="settings-section">
      <SectionLabel>Datos de la organización</SectionLabel>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 'var(--fs-body-lg)', color: 'var(--text-primary)' }}>
              {org.name}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: 4 }}>
              Rol asignado: {org.role}
            </div>
          </div>
          <Badge tone="gold-soft">{org.type}</Badge>
        </div>
        <Field label="Email institucional">
          <input className="input" value="contacto@corpoamazonia.gov.co" disabled />
        </Field>
        <div style={{ marginTop: 'var(--space-3)' }}>
          <Button variant="ghost" size="sm">Solicitar cambio de datos</Button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Tab: Zonas monitoreadas ────────────────────────────────── */
function ZonesTab() {
  return (
    <div className="settings-section">
      <SectionLabel>Zonas piloto configuradas</SectionLabel>
      <Card>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <li style={{ padding: 'var(--space-3)', background: 'var(--surface-1)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-subtle)' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--text-primary)' }}>
              Cuenca Caquetá · Apaporis
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: 4 }}>
              bbox: [-73.5, -1.5, -71.5, 0.5]
            </div>
          </li>
          <li style={{ padding: 'var(--space-3)', background: 'var(--surface-1)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-subtle)' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--text-primary)' }}>
              Cuenca Inírida · Guainía
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: 4 }}>
              bbox: [-68.5, 3.0, -67.5, 4.5]
            </div>
          </li>
        </ul>
        <div style={{ marginTop: 'var(--space-3)' }}>
          <Button variant="ghost" size="sm">Solicitar modificación de zonas</Button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Tab: Notificaciones ────────────────────────────────────── */
function NotificationsTab({ onSaved }: { onSaved: () => void }) {
  const [emailOnAlert, setEmailOnAlert] = useState(true);
  const [onlyLevel3, setOnlyLevel3] = useState(false);
  const [digest, setDigest] = useState<'immediate' | 'daily' | 'weekly'>('immediate');

  return (
    <div className="settings-section">
      <SectionLabel>Preferencias de notificación</SectionLabel>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body-lg)', color: 'var(--text-primary)' }}>
              Recibir email cuando hay nueva alerta
            </span>
            <Toggle checked={emailOnAlert} onChange={setEmailOnAlert} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body-lg)', color: 'var(--text-primary)' }}>
              Solo alertas de nivel 3 (Crítico)
            </span>
            <Toggle checked={onlyLevel3} onChange={setOnlyLevel3} />
          </div>
          <Field label="Frecuencia de resumen">
            <select
              className="input"
              value={digest}
              onChange={(e) => setDigest(e.target.value as 'immediate' | 'daily' | 'weekly')}
            >
              <option value="immediate">Inmediato</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
            </select>
          </Field>
          <Button variant="primary" onClick={onSaved}>
            Guardar preferencias
          </Button>
        </div>
      </Card>
    </div>
  );
}
