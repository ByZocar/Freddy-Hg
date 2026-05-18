/**
 * ☿ FREDDY Hg — Admin: gestión de destinatarios
 * Spec: FRONTEND_SPEC_COMPLETO.md § Pantalla 8.
 */
import { useEffect, useState } from 'react';
import { IconAlertTriangle, IconShieldLock, IconPlus, IconTrash } from '@tabler/icons-react';
import Navbar from '../components/layout/Navbar';
import { Card, SectionLabel } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LabeledInput, Field } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { AlertBox } from '../components/ui/AlertBox';
import { useAuth } from '../hooks/useAuth';
import { useAlerts } from '../hooks/useAlerts';
import { useToast } from '../hooks/useToast';
import { addRecipient, listRecipients, removeRecipient, type RecipientRow } from '../lib/api';
import { formatRelative } from '../lib/format';

interface Recipient {
  id: string;
  phone_last4: string;
  role: string | null;
  basins: string[];
  last_alert_at: string | null;
}

function mapRow(row: RecipientRow): Recipient {
  return {
    id: row.id,
    phone_last4: row.phone_last4 || (row.phone_number_hash || '').slice(-4),
    role: row.role,
    basins: Array.isArray(row.basin_ids) ? row.basin_ids : [],
    last_alert_at: null,
  };
}

const BASIN_OPTIONS = [
  { value: 'caqueta', label: 'Río Caquetá · Amazonas' },
  { value: 'apaporis', label: 'Río Apaporis · Vaupés' },
  { value: 'inirida', label: 'Río Inírida · Guainía' },
  { value: 'all', label: 'Todas las cuencas' },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const { alerts } = useAlerts({ confidenceMin: 1 });
  const toast = useToast();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [basin, setBasin] = useState<string>('caqueta');
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const refresh = async () => {
    setLoadingList(true);
    try {
      const rows = await listRecipients();
      setRecipients(rows.filter((r) => r.active !== false).map(mapRow));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phone.startsWith('+') || phone.length < 8) {
      toast.error('Ingresa un número internacional válido (ej: +573153350984).');
      return;
    }
    setSubmitting(true);
    try {
      const created = await addRecipient({ phone, role, basins: [basin] });
      if (created) {
        setRecipients((prev) => [mapRow(created), ...prev]);
      } else {
        await refresh();
      }
      setPhone('');
      setRole('');
      toast.success('Destinatario añadido');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemove = async () => {
    if (!pendingDeleteId) return;
    try {
      await removeRecipient(pendingDeleteId);
      setRecipients((prev) => prev.filter((r) => r.id !== pendingDeleteId));
      toast.success('Destinatario removido');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="page-shell">
      <Navbar user={user} alerts={alerts} />
      <div className="page-shell__body">
        <div className="admin-page">
          <h1 className="admin-page__title">Gestión de destinatarios</h1>
          <p className="admin-page__subtitle">
            Configura quién recibe los mensajes WhatsApp/SMS de alerta. Los números se almacenan
            de forma segura con hash SHA-256 — nunca se comparten ni se muestran completos.
          </p>

          <div style={{ marginTop: 'var(--space-6)' }}>
            <AlertBox tone="info" icon={<IconShieldLock size={16} stroke={1.5} />}>
              El número completo nunca se almacena en la base de datos. Solo el hash SHA-256
              queda en el servidor.
            </AlertBox>
          </div>

          <section className="admin-section">
            <SectionLabel>Añadir destinatario</SectionLabel>
            <Card style={{ marginTop: 'var(--space-2)' }}>
              <form className="admin-form" onSubmit={handleAdd}>
                <LabeledInput
                  label="Número de WhatsApp / SMS"
                  placeholder="+57 315 335 0984"
                  mono
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <LabeledInput
                  label="Nombre o rol (opcional)"
                  placeholder="Guardia Territorio Norte"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
                <Field label="Cuenca de interés">
                  <select
                    className="input"
                    value={basin}
                    onChange={(e) => setBasin(e.target.value)}
                  >
                    {BASIN_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Button
                  type="submit"
                  variant="primary"
                  block
                  loading={submitting}
                  iconLeft={<IconPlus size={16} stroke={1.5} />}
                >
                  Añadir destinatario
                </Button>
              </form>
            </Card>
          </section>

          <section className="admin-section">
            <SectionLabel>
              Destinatarios activos · {recipients.length}
              {loadingList ? ' · cargando…' : ''}
            </SectionLabel>
            {recipients.length === 0 ? (
              <Card size="md" style={{ marginTop: 'var(--space-2)' }}>
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  {loadingList ? 'Cargando destinatarios…' : 'Sin destinatarios registrados.'}
                </div>
              </Card>
            ) : (
              <table className="recipients-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Rol</th>
                    <th>Cuencas</th>
                    <th>Última alerta</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r) => (
                    <tr key={r.id}>
                      <td className="cell-phone">+57 ••• ••• {r.phone_last4}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.role ?? '—'}</td>
                      <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {r.basins.map((b) => (
                          <Badge key={b} tone="gold-soft">{b}</Badge>
                        ))}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {r.last_alert_at ? formatRelative(r.last_alert_at) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="danger"
                          size="sm"
                          iconLeft={<IconTrash size={14} stroke={1.5} />}
                          onClick={() => setPendingDeleteId(r.id)}
                        >
                          Remover
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>

      {pendingDeleteId && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <IconAlertTriangle size={28} stroke={1.5} color="var(--color-alert-warning)" />
            <div className="modal-card__title">¿Remover destinatario?</div>
            <div className="modal-card__text">
              Este número dejará de recibir alertas de Freddy Hg. La acción es inmediata.
            </div>
            <div className="modal-card__actions">
              <Button variant="ghost" onClick={() => setPendingDeleteId(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmRemove}>
                Sí, remover
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
