import type { Alert } from '../hooks/useAlerts';

interface Props {
  alert: Alert | null;
  onClose: () => void;
  onExport: (id: string) => void;
  onChangeState: (id: string, state: string) => void;
}

const STATES = [
  { value: 'revisando', label: 'En revisión' },
  { value: 'en_campo', label: 'En campo' },
  { value: 'medida_cautelar', label: 'Medida cautelar' },
  { value: 'archivado', label: 'Archivado' },
  { value: 'falso_positivo', label: 'Falso positivo' },
];

export default function AlertPanel({ alert, onClose, onExport, onChangeState }: Props) {
  if (!alert) return null;

  const lat = alert.centroid_lat.toFixed(6);
  const lon = alert.centroid_lon.toFixed(6);

  return (
    <aside className="alert-panel">
      <header>
        <h2>Alerta — Nivel {alert.confidence_level}</h2>
        <button onClick={onClose} aria-label="Cerrar">✕</button>
      </header>

      <section>
        <h3>Localización</h3>
        <p><strong>Lat / Lon:</strong> {lat}, {lon}</p>
        <p><strong>Backscatter VV:</strong> {alert.backscatter_vv} dB</p>
        <p><strong>Área:</strong> {alert.area_m2} m² ({alert.pixel_count} píxeles)</p>
      </section>

      <section>
        <h3>Calificación legal</h3>
        <p><strong>Estado ANM:</strong> {alert.legal_status}</p>
        {alert.concession_id && <p><strong>Concesión:</strong> {alert.concession_id}</p>}
        <p><strong>Resguardo:</strong> {alert.indigenous_territory || '—'}</p>
        <p><strong>Pueblo:</strong> {alert.indigenous_nation || '—'}</p>
        <p><strong>Requiere protocolo DDHH:</strong> {alert.requires_ddhh_protocol ? 'Sí' : 'No'}</p>
      </section>

      {alert.mistral_context && (
        <section className="mistral">
          <h3>Contexto (Mistral AI)</h3>
          <p>{alert.mistral_context}</p>
        </section>
      )}

      {alert.impact_metrics && (
        <section>
          <h3>Métricas de impacto</h3>
          <p><strong>Mercurio estimado:</strong> {alert.impact_metrics.mercury_kg} kg/año</p>
          <p><strong>Daño económico:</strong> US${alert.impact_metrics.damage_usd}</p>
          <p><strong>Personas en riesgo:</strong> {alert.impact_metrics.people_at_risk}</p>
        </section>
      )}

      <section>
        <h3>Cadena de custodia</h3>
        <p className="sha256">{alert.sha256_evidence}</p>
      </section>

      <section>
        <h3>Acciones</h3>
        <button onClick={() => onExport(alert.id)} className="primary">
          📄 Exportar informe técnico (PDF)
        </button>
        <div className="state-buttons">
          {STATES.map((s) => (
            <button key={s.value} onClick={() => onChangeState(alert.id, s.value)}>
              {s.label}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
