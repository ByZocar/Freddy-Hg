/**
 * ☿ FREDDY Hg — AlertDetail
 * Spec: FRONTEND_SPEC_COMPLETO.md § Pantalla 5.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconFileDownload,
  IconSatellite,
} from '@tabler/icons-react';
import Navbar from '../components/layout/Navbar';
import { LevelBadge } from '../components/ui/Badge';
import { Stat } from '../components/ui/Stat';
import { Button } from '../components/ui/Button';
import { Divider } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { useAlerts } from '../hooks/useAlerts';
import { useToast } from '../hooks/useToast';
import type { Alert } from '../hooks/useAlerts';
import { downloadPdf } from '../lib/api';
import {
  formatCoords,
  formatHumanUTC,
  formatNumber,
  formatUSD,
  inferRiverName,
  legalStatusLabel,
} from '../lib/format';

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { alerts, loading } = useAlerts({ confidenceMin: 1 });
  const [alert, setAlert] = useState<Alert | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!id || loading) return;
    const found = alerts.find((a) => a.id === id);
    setAlert(found ?? null);
  }, [id, alerts, loading]);

  const handleExport = async () => {
    if (!alert) return;
    setExporting(true);
    toast.info('Generando PDF…');
    try {
      const blob = await downloadPdf(alert.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `freddy_hg_alerta_${alert.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF descargado');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const copyHash = async () => {
    if (!alert) return;
    await navigator.clipboard.writeText(alert.sha256_evidence);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="page-shell">
      <Navbar user={user} alerts={alerts} />

      <div className="page-shell__body">
        <div className="page-content">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span> / </span>
            <Link to="/dashboard">Alertas</Link>
            <span> / </span>
            <span style={{ color: 'var(--text-secondary)' }}>{id?.slice(0, 8)}</span>
          </nav>

          {loading && (
            <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Cargando alerta…
            </div>
          )}

          {!loading && !alert && (
            <div className="empty-state">
              <IconSatellite size={48} stroke={1.5} className="empty-state__icon" />
              <div className="empty-state__title">404 — Alerta no encontrada</div>
              <div className="empty-state__subtitle">
                Esta alerta no existe en la base de datos o ha sido eliminada.
              </div>
              <div className="empty-state__meta">ALERT-{id?.slice(0, 8) ?? '????'}</div>
              <Button variant="primary" onClick={() => navigate('/dashboard')}>
                Volver al dashboard
              </Button>
            </div>
          )}

          {alert && <AlertDetailBody alert={alert} onExport={handleExport} exporting={exporting} onCopyHash={copyHash} copied={copied} />}
        </div>
      </div>
    </div>
  );
}

function AlertDetailBody({
  alert,
  onExport,
  exporting,
  onCopyHash,
  copied,
}: {
  alert: Alert;
  onExport: () => void;
  exporting: boolean;
  onCopyHash: () => void;
  copied: boolean;
}) {
  const river = inferRiverName(alert.centroid_lat, alert.centroid_lon);
  const legal = legalStatusLabel(alert.legal_status);
  const hgKg = alert.impact_metrics?.mercury_kg;
  const damageUsd = alert.impact_metrics?.damage_usd;
  const peopleAtRisk = alert.impact_metrics?.people_at_risk;

  return (
    <>
      <div className="alert-detail__header">
        <LevelBadge level={alert.confidence_level ?? 1} />
        <h1 className="alert-detail__title">Alerta detectada</h1>
      </div>
      <div className="alert-detail__meta">
        <span className="alert-detail__meta-gold">{`ALERT-${alert.id.slice(0, 8).toUpperCase()}`}</span>
        <span> · </span>
        <span>{river}</span>
        <span> · </span>
        <span>{formatHumanUTC(alert.scene_date_utc)}</span>
      </div>

      <Divider />

      <div className="alert-detail__grid">
        <Stat
          value={legal.short}
          label={`Estado ANM — ${legal.long}`}
          tone={legal.tone === 'critical' ? 'critical' : legal.tone === 'safe' ? 'safe' : 'gold'}
          size="lg"
        />
        <Stat
          value={`NIVEL ${alert.confidence_level ?? 1}`}
          label="Confianza SAR"
          tone="gold"
          size="lg"
        />
        <Stat
          value={alert.area_m2 !== null ? formatNumber(alert.area_m2) : '—'}
          unit="m²"
          label="Área detectada"
          tone="gold"
          size="lg"
        />
        <Stat
          value={formatCoords(alert.centroid_lat, alert.centroid_lon)}
          label="Coordenadas (WGS84)"
          tone="gold"
          size="lg"
        />
        <Stat
          value={hgKg !== null && hgKg !== undefined ? formatNumber(hgKg) : '—'}
          unit="kg"
          label="Hg estimado (proxy)"
          tone={hgKg && hgKg > 100 ? 'critical' : 'gold'}
          size="lg"
        />
        <Stat
          value={damageUsd !== null && damageUsd !== undefined ? formatUSD(damageUsd) : '—'}
          label="Costo remediación estimado"
          tone="gold"
          size="lg"
        />
        <Stat
          value={peopleAtRisk !== null && peopleAtRisk !== undefined ? formatNumber(peopleAtRisk) : '—'}
          unit="personas"
          label="Aguas abajo 50 km"
          tone="gold"
          size="lg"
        />
        <Stat
          value={alert.indigenous_territory ?? '—'}
          label="Territorio indígena afectado"
          tone={alert.indigenous_territory ? 'critical' : 'silver'}
          size="lg"
        />
      </div>

      <div className="alert-detail__sar-img">
        <IconSatellite size={32} stroke={1.5} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          Vista SAR no disponible
        </div>
      </div>
      <div className="alert-detail__caption">
        Imagen: Sentinel-1 SAR GRD · Polarización VV ·{' '}
        <span style={{ wordBreak: 'break-all' }}>{alert.scene_id}</span>
      </div>

      <section className="alert-detail__section">
        <div className="alert-detail__section-title">Análisis de contexto (Mistral AI)</div>
        <div className="alert-detail__mistral">
          {alert.mistral_context || 'Contexto no disponible para esta alerta.'}
        </div>
      </section>

      <section className="alert-detail__section">
        <div className="alert-detail__section-title">Cadena de custodia digital</div>
        <div className="alert-detail__hash-block">
          <div className="alert-detail__hash-label">HASH SHA-256</div>
          <div className="alert-detail__hash-value">{alert.sha256_evidence}</div>
          <button
            type="button"
            onClick={onCopyHash}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: copied ? 'var(--text-safe)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--fs-small)',
              cursor: 'pointer',
              padding: 0,
              marginBottom: 'var(--space-3)',
            }}
          >
            {copied ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} stroke={1.5} />}
            {copied ? 'Copiado' : 'Copiar hash'}
          </button>
          <div className="alert-detail__hash-hint">
            Este hash es reproducible consultando la escena{' '}
            <span style={{ fontFamily: 'var(--font-mono)' }}>{alert.scene_id}</span> en la colección{' '}
            <span style={{ fontFamily: 'var(--font-mono)' }}>COPERNICUS/S1_GRD</span> de Google Earth Engine.
          </div>
        </div>
      </section>

      <div className="alert-detail__actions">
        <Button
          variant="primary"
          loading={exporting}
          onClick={onExport}
          iconLeft={<IconFileDownload size={16} stroke={1.5} />}
        >
          Exportar informe técnico (PDF)
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (alert.alert_url) window.open(alert.alert_url, '_blank');
          }}
          iconRight={<IconExternalLink size={14} stroke={1.5} />}
        >
          Abrir URL permanente
        </Button>
      </div>
    </>
  );
}
