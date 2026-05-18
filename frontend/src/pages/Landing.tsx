/**
 * ☿ FREDDY Hg — Landing page
 *
 * Cuenta la historia completa de Freddy Hg basada en la investigación
 * acumulada en 01_investigacion, 02_producto y 03_negocio.
 *
 * Estructura narrativa (8 actos):
 *  1. Hero  ──────────────  "Freddy Hg · ver para actuar desde el espacio"
 *  2. Shock ──────────────  La cifra que duele: 116 ppm en cabello humano
 *  3. KPIs  ──────────────  La magnitud del problema (4 cifras)
 *  4. Timeline ───────────  36 años de latencia 1989 → 2025
 *  5. Por qué fallan ─────  Tabla comparativa AMW/GFW/MAAP vs. Freddy Hg
 *  6. Cómo funciona ──────  Pipeline visual en 5 pasos
 *  7. Quién lo usa ───────  3 perfiles de usuario
 *  8. Acceso + CTA ───────  Freemium / SaaS / Institucional
 *  Footer
 *
 * Todas las fuentes están citadas inline siguiendo las brand guidelines
 * (datos técnicos en IBM Plex Mono, citas en italic, sin gradientes).
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IconArrowRight,
  IconBuilding,
  IconCheck,
  IconDatabase,
  IconDeviceMobile,
  IconExternalLink,
  IconFileCertificate,
  IconFileDownload,
  IconLock,
  IconRadar2,
  IconReportSearch,
  IconSatellite,
  IconShieldCheck,
  IconSparkles,
  IconUsers,
  IconWaveSawTool,
} from '@tabler/icons-react';
import Wordmark from '../components/brand/Wordmark';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export default function Landing() {
  useEffect(() => {
    document.body.classList.add('body--landing');
    document.body.style.overflow = 'auto';
    return () => {
      document.body.classList.remove('body--landing');
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="landing">
      {/* ─── NAV ─────────────────────────────────────────── */}
      <header className="landing-nav">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Wordmark variant="navbar" />
        </Link>
        <nav className="landing-nav__links" aria-label="Secciones">
          <a href="#problema" className="landing-nav__link">El problema</a>
          <a href="#solucion" className="landing-nav__link">La solución</a>
          <a href="#usuarios" className="landing-nav__link">Usuarios</a>
          <a href="#acceso" className="landing-nav__link">Acceso</a>
        </nav>
        <div className="landing-nav__cta">
          <Link to="/public" className="landing-nav__link">Portal público</Link>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">Iniciar sesión</Button>
          </Link>
        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__symbol">
          <img
            src="/brand/freddy-hg-emblem.png"
            alt="Emblema Freddy Hg — patrón radial de 16 brazos en oro y plata"
            className="hero__emblem"
            width={560}
            height={560}
            loading="eager"
            fetchPriority="high"
          />
        </div>
        <div className="hero__body">
          <div className="landing-eyebrow">
            <span className="landing-eyebrow__line" />
            Sistema de Alerta Temprana Satelital
          </div>
          <h1 className="hero__title">
            <span className="hero__title-line">Ver para actuar.</span>
            <span className="hero__title-line hero__title-line--gold">Desde el espacio.</span>
          </h1>
          <p className="hero__sub">
            Freddy Hg detecta minería ilegal de oro en los ríos de la Amazonía
            colombiana usando radar Sentinel-1 — lo que las nubes esconden y
            ningún sistema óptico ve. En 72 horas convierte una draga invisible
            en una alerta legalmente admisible.
          </p>
          <div className="hero__ctas">
            <Link to="/public" style={{ textDecoration: 'none' }}>
              <Button
                variant="primary"
                iconRight={<IconArrowRight size={16} stroke={1.8} />}
              >
                Explorar datos públicos
              </Button>
            </Link>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="ghost"
                iconLeft={<IconLock size={14} stroke={1.5} />}
              >
                Acceso institucional
              </Button>
            </Link>
          </div>
          <div className="hero__meta">
            <span className="hero__meta-dot" />
            Pipeline activo · Sentinel-1 SAR · cada 6 días
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <a
              href="https://github.com/ByZocar/Freddy-Hg"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Open source <IconExternalLink size={12} stroke={1.5} />
            </a>
          </div>
        </div>
      </section>

      {/* ─── SHOCK BANNER — la cifra que duele ──────────── */}
      <section className="shock-banner" aria-label="Cifra crítica">
        <div className="shock-banner__inner">
          <div className="shock-banner__number">116×</div>
          <div className="shock-banner__text">
            <div className="shock-banner__label">Mercurio en cabello humano · Quibdó</div>
            <div className="shock-banner__headline">
              116 veces el límite seguro de la OMS.
            </div>
            <div className="shock-banner__source">
              Fuente: Defensoría del Pueblo de Colombia.
              No es un accidente — es el resultado de 40 años de minería ilegal
              que nadie monitorea en tiempo real.
            </div>
          </div>
        </div>
      </section>

      {/* ─── KPI STRIP ──────────────────────────────────── */}
      <div className="kpi-strip" aria-label="Cifras clave del problema">
        <div className="kpi-strip__cell">
          <div className="kpi-strip__value">105.060</div>
          <div className="kpi-strip__label">Hectáreas de minería aluvial<br />en Colombia (SIMCI 2023)</div>
        </div>
        <div className="kpi-strip__cell">
          <div className="kpi-strip__value">76%</div>
          <div className="kpi-strip__label">de esa minería es ilegal<br />(SIMCI / UNODC)</div>
        </div>
        <div className="kpi-strip__cell">
          <div className="kpi-strip__value">29 / 32</div>
          <div className="kpi-strip__label">Departamentos colombianos<br />afectados (Procuraduría 2024)</div>
        </div>
        <div className="kpi-strip__cell">
          <div className="kpi-strip__value">US$8.4B</div>
          <div className="kpi-strip__label">Anuales por minería ilegal<br />en Colombia (2025)</div>
        </div>
      </div>

      {/* ─── PROBLEMA: TIMELINE 36 AÑOS ─────────────────── */}
      <section id="problema" className="landing-section landing-section--narrow">
        <div className="landing-eyebrow">
          <span className="landing-eyebrow__line" />
          El problema
        </div>
        <h2 className="landing-h2">
          36 años de latencia.<br />
          <span className="landing-h1__gold">Las dragas siguen activas.</span>
        </h2>
        <p className="landing-lead" style={{ marginTop: 'var(--space-4)' }}>
          El caso del Macroterritorio Jaguares del Yuruparí — 30 pueblos indígenas,
          12.000 personas — ilustra el problema con precisión quirúrgica.
          El problema nunca fue falta de información.
        </p>

        <div className="timeline">
          <div className="timeline-item timeline-item--first timeline-item--critical">
            <div className="timeline-item__dot" />
            <div className="timeline-item__year">1989</div>
            <div className="timeline-item__text">
              <strong>Primeras denuncias comunitarias</strong> sobre actividad minera
              en los ríos Caquetá y Apaporis.
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-item__dot" />
            <div className="timeline-item__year">2010</div>
            <div className="timeline-item__text">
              Dragas documentadas visualmente por comunidades indígenas.
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-item__dot" />
            <div className="timeline-item__year">2013</div>
            <div className="timeline-item__text">
              <strong>Corpoamazonía notifica oficialmente</strong> a la
              Defensoría del Pueblo. La situación continúa 12 años más sin resolverse.
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-item__dot" />
            <div className="timeline-item__year">2015</div>
            <div className="timeline-item__text">
              La Fiscalía General tiene imágenes satelitales. Nadie las cruza con
              concesiones, ni con resguardos, ni con riesgo de mercurio aguas abajo.
            </div>
          </div>
          <div className="timeline-item timeline-item--last">
            <div className="timeline-item__dot" />
            <div className="timeline-item__year">2025</div>
            <div className="timeline-item__text">
              <strong>Sentencia T-106/25 de la Corte Constitucional:</strong>{' '}
              32 órdenes a 27 entidades estatales por envenenamiento por mercurio
              de pueblos indígenas amazónicos.
            </div>
          </div>
          <div className="timeline-item timeline-item--critical">
            <div className="timeline-item__dot" />
            <div className="timeline-item__year">2026</div>
            <div className="timeline-item__text">
              <strong>Las dragas siguen activas.</strong> El Estado tarda décadas en
              actuar sobre información que los satélites ya tienen disponible.
            </div>
          </div>
        </div>

        <div className="timeline-callout">
          El problema nunca fue la falta de información.<br />
          Es que la información no se convierte en acción.
        </div>

        <blockquote className="quote">
          <div className="quote__text">
            "Queremos que la información recolectada contribuya a la proyección del
            territorio, de los pueblos yuri-passé y de los otros 16 pueblos en
            estado natural de los que se tiene indicios de su existencia."
          </div>
          <div className="quote__author">
            Darío Silva · líder indígena, guardia del río Caquetá ·
            entrevista en Mongabay Latam, 2025
          </div>
        </blockquote>
      </section>

      {/* ─── POR QUÉ FALLAN LAS SOLUCIONES EXISTENTES ───── */}
      <section className="landing-section">
        <div className="landing-eyebrow">
          <span className="landing-eyebrow__line" />
          La brecha técnica
        </div>
        <h2 className="landing-h2">
          La minería colombiana es <span className="landing-h1__gold">fluvial</span>.
          Los sistemas existentes detectan <span className="landing-h1__gold">deforestación</span>.
        </h2>
        <p className="landing-lead" style={{ marginTop: 'var(--space-4)', maxWidth: 720 }}>
          Una draga sobre un río amazónico no deja huella forestal y opera bajo el
          dosel de vegetación ribereña. Es invisible para los sistemas ópticos
          como Amazon Mining Watch, MapBiomas o Global Forest Watch.
        </p>

        <table className="compare-table">
          <thead>
            <tr>
              <th>Plataforma</th>
              <th>Detecta dragas fluviales</th>
              <th>Alertas ≤ 72 h</th>
              <th>Evidencia legal</th>
              <th>Llega a CAR + guardián</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Amazon Mining Watch</td>
              <td><span className="no">No</span></td>
              <td><span className="no">No (anual)</span></td>
              <td><span className="no">No</span></td>
              <td><span className="no">No</span></td>
            </tr>
            <tr>
              <td>Global Forest Watch</td>
              <td><span className="no">No</span></td>
              <td><span className="partial">Solo deforestación</span></td>
              <td><span className="no">No</span></td>
              <td><span className="no">No</span></td>
            </tr>
            <tr>
              <td>MAAP</td>
              <td><span className="partial">Sí, manual</span></td>
              <td><span className="no">Ad-hoc</span></td>
              <td><span className="no">No estandarizada</span></td>
              <td><span className="no">No</span></td>
            </tr>
            <tr>
              <td>MapBiomas Mining</td>
              <td><span className="no">No</span></td>
              <td><span className="no">Anual</span></td>
              <td><span className="no">No</span></td>
              <td><span className="no">No</span></td>
            </tr>
            <tr className="row-us">
              <td>Freddy Hg</td>
              <td><span className="yes">Sí (SAR automático)</span></td>
              <td><span className="yes">Sí (≤ 72 h)</span></td>
              <td><span className="yes">PDF + SHA-256</span></td>
              <td><span className="yes">Email + WhatsApp</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ─── CÓMO FUNCIONA — PIPELINE ───────────────────── */}
      <section id="solucion" className="landing-section">
        <div className="landing-eyebrow">
          <span className="landing-eyebrow__line" />
          La solución
        </div>
        <h2 className="landing-h2">
          De la imagen satelital a la acción legal<br />
          <span className="landing-h1__gold">en 72 horas.</span>
        </h2>

        <div className="pipeline-flow">
          <div className="pipeline-step">
            <div className="pipeline-step__num">PASO 01</div>
            <span className="pipeline-step__icon">
              <IconSatellite size={22} stroke={1.5} />
            </span>
            <div className="pipeline-step__title">Captura SAR</div>
            <div className="pipeline-step__body">
              Sentinel-1 pasa sobre Colombia cada 6 días. El radar penetra nubes y
              detecta el metal de las dragas sobre el agua.
            </div>
          </div>
          <div className="pipeline-step">
            <div className="pipeline-step__num">PASO 02</div>
            <span className="pipeline-step__icon">
              <IconRadar2 size={22} stroke={1.5} />
            </span>
            <div className="pipeline-step__title">Detección automática</div>
            <div className="pipeline-step__body">
              Umbralización VV &gt; −10 dB sobre cuerpos de agua. Filtro de área
              ≥ 200 m². Análisis de cambio vs. baseline 2018-2019.
            </div>
          </div>
          <div className="pipeline-step">
            <div className="pipeline-step__num">PASO 03</div>
            <span className="pipeline-step__icon">
              <IconFileCertificate size={22} stroke={1.5} />
            </span>
            <div className="pipeline-step__title">Cruce legal</div>
            <div className="pipeline-step__body">
              Geofencing automático contra el catastro ANM y los polígonos de
              resguardos indígenas RAISG. Nivel de confianza 1 / 2 / 3.
            </div>
          </div>
          <div className="pipeline-step">
            <div className="pipeline-step__num">PASO 04</div>
            <span className="pipeline-step__icon">
              <IconSparkles size={22} stroke={1.5} />
            </span>
            <div className="pipeline-step__title">Contexto Mistral AI</div>
            <div className="pipeline-step__body">
              Cada alerta se enriquece con resumen periodístico, métricas de
              impacto (Hg estimado, personas en riesgo) y declaración legal.
            </div>
          </div>
          <div className="pipeline-step">
            <div className="pipeline-step__num">PASO 05</div>
            <span className="pipeline-step__icon">
              <IconDeviceMobile size={22} stroke={1.5} />
            </span>
            <div className="pipeline-step__title">Despacho</div>
            <div className="pipeline-step__body">
              Email al funcionario CAR · WhatsApp ≤ 160 chars al guardián
              indígena · PDF con SHA-256 listo para expediente sancionatorio.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Badge tone="gold-soft">Google Earth Engine</Badge>
          <Badge tone="gold-soft">Sentinel-1 SAR</Badge>
          <Badge tone="gold-soft">Mistral AI</Badge>
          <Badge tone="gold-soft">ANM Colombia</Badge>
          <Badge tone="gold-soft">RAISG · HydroSHEDS</Badge>
          <Badge tone="gold-soft">Twilio · WhatsApp</Badge>
          <Badge tone="gold-soft">Supabase · PostGIS</Badge>
          <Badge tone="gold-soft">SHA-256 · Ley 1333/2009</Badge>
        </div>
      </section>

      {/* ─── QUIÉN LO USA ───────────────────────────────── */}
      <section id="usuarios" className="landing-section">
        <div className="landing-eyebrow">
          <span className="landing-eyebrow__line" />
          Para quién es
        </div>
        <h2 className="landing-h2">
          Tres usuarios.<br />
          <span className="landing-h1__gold">Una sola red operativa.</span>
        </h2>
        <p className="landing-lead" style={{ marginTop: 'var(--space-4)', maxWidth: 720 }}>
          Cada actor recibe exactamente lo que necesita en el canal que ya usa.
          El funcionario CAR un dashboard con PDF para expediente. El guardián
          indígena un mensaje de WhatsApp. La ONG un mapa abierto con descargas.
        </p>

        <div className="users-grid">
          <article className="user-card">
            <div className="user-card__role">Usuario primario</div>
            <span className="user-card__icon">
              <IconBuilding size={28} stroke={1.5} />
            </span>
            <div className="user-card__title">Profesional CAR</div>
            <div className="user-card__sub">Corporaciones Autónomas Regionales</div>
            <div className="user-card__body">
              Recibe la alerta por email con el polígono detectado, las concesiones
              ANM vigentes, los resguardos afectados y un PDF con SHA-256 listo para
              adjuntar al Auto de Apertura de Indagación Preliminar (Ley 1333/2009).
            </div>
            <hr className="user-card__hr" />
            <div className="user-card__channel">CANAL · Dashboard web + Email + PDF</div>
          </article>

          <article className="user-card">
            <div className="user-card__role">Receptor secundario</div>
            <span className="user-card__icon">
              <IconUsers size={28} stroke={1.5} />
            </span>
            <div className="user-card__title">Guardián indígena</div>
            <div className="user-card__sub">ACIYA · PANI · OPIAC · AATIZOT</div>
            <div className="user-card__body">
              Recibe un mensaje WhatsApp / SMS de máximo 160 caracteres con el río,
              el nivel, las coordenadas y un enlace a un mapa estático. Sin app,
              sin registro, sin almacenamiento de su número.
            </div>
            <hr className="user-card__hr" />
            <div className="user-card__channel">CANAL · WhatsApp + SMS (2G)</div>
          </article>

          <article className="user-card">
            <div className="user-card__role">Cliente primario</div>
            <span className="user-card__icon">
              <IconReportSearch size={28} stroke={1.5} />
            </span>
            <div className="user-card__title">Analista ONG · Periodista</div>
            <div className="user-card__sub">FCDS · Gaia Amazonas · Mongabay</div>
            <div className="user-card__body">
              Ve el mapa público con todas las alertas, filtra por cuenca, descarga
              GeoJSON / CSV para QGIS y ArcGIS, cita los datos con licencia CC BY 4.0
              en reportajes con la evidencia satelital trazable.
            </div>
            <hr className="user-card__hr" />
            <div className="user-card__channel">CANAL · Portal público + API + Descargas</div>
          </article>
        </div>
      </section>

      {/* ─── EARLY ADOPTERS ──────────────────────────────── */}
      <section className="landing-section landing-section--tight">
        <div style={{ textAlign: 'center' }}>
          <div className="landing-eyebrow" style={{ justifyContent: 'center' }}>
            <span className="landing-eyebrow__line" />
            Early adopters identificados
            <span className="landing-eyebrow__line" />
          </div>
          <h3 className="landing-h3">El mercado ya existe.</h3>
        </div>
        <div className="partners-strip">
          <div className="partner-chip">
            <span className="partner-chip__role">CAR</span> Corpoamazonía
          </div>
          <div className="partner-chip">
            <span className="partner-chip__role">CAR</span> CDA Guainía
          </div>
          <div className="partner-chip">
            <span className="partner-chip__role">ONG</span> FCDS
          </div>
          <div className="partner-chip">
            <span className="partner-chip__role">ONG</span> Gaia Amazonas
          </div>
          <div className="partner-chip">
            <span className="partner-chip__role">Indígena</span> OPIAC / ACIYA
          </div>
          <div className="partner-chip">
            <span className="partner-chip__role">Prensa</span> Mongabay Latam
          </div>
        </div>
      </section>

      {/* ─── ACCESO ──────────────────────────────────────── */}
      <section id="acceso" className="landing-section">
        <div className="landing-eyebrow">
          <span className="landing-eyebrow__line" />
          Acceso
        </div>
        <h2 className="landing-h2">Tres vías de entrada.</h2>
        <p className="landing-lead" style={{ marginTop: 'var(--space-4)', maxWidth: 720 }}>
          Los datos básicos son siempre públicos — la transparencia es parte de la
          misión. Las alertas en tiempo real, los informes legales y la API quedan
          para las instituciones que necesitan operar con ellos.
        </p>

        <div className="access-grid">
          <article className="access-card">
            <div className="access-card__tier">Periodistas · Investigadores · Público</div>
            <div className="access-card__price access-card__price--free">Gratis</div>
            <div className="access-card__title">Portal público</div>
            <p className="access-card__body">
              Acceso al mapa de alertas con 30 días de retraso. Descarga de
              GeoJSON y CSV con licencia CC BY 4.0. Citable en reportajes.
            </p>
            <ul className="access-card__list">
              <li><IconCheck size={14} stroke={2} /> Mapa público de alertas</li>
              <li><IconCheck size={14} stroke={2} /> Descarga GeoJSON / CSV</li>
              <li><IconCheck size={14} stroke={2} /> Sin registro</li>
            </ul>
            <Link to="/public" style={{ textDecoration: 'none', marginTop: 'var(--space-2)' }}>
              <Button variant="ghost" block iconRight={<IconArrowRight size={14} stroke={1.8} />}>
                Entrar al portal público
              </Button>
            </Link>
          </article>

          <article className="access-card access-card--featured">
            <div className="access-card__tier">CAR · ONG · MADS · Fiscalía DEMA</div>
            <div className="access-card__price">Institucional</div>
            <div className="access-card__title">Plataforma operativa</div>
            <p className="access-card__body">
              Alertas en tiempo real, panel de gestión de casos, exportación PDF
              admisible (Ley 1333), API REST, gestión de destinatarios WhatsApp.
            </p>
            <ul className="access-card__list">
              <li><IconCheck size={14} stroke={2} /> Alertas ≤ 72 h</li>
              <li><IconCheck size={14} stroke={2} /> PDF con SHA-256</li>
              <li><IconCheck size={14} stroke={2} /> Mistral AI por alerta</li>
              <li><IconCheck size={14} stroke={2} /> 2FA TOTP obligatorio</li>
            </ul>
            <Link to="/login" style={{ textDecoration: 'none', marginTop: 'var(--space-2)' }}>
              <Button variant="primary" block iconRight={<IconArrowRight size={14} stroke={1.8} />}>
                Iniciar sesión institucional
              </Button>
            </Link>
          </article>

          <article className="access-card">
            <div className="access-card__tier">Comunidades indígenas · Guardianes</div>
            <div className="access-card__price">Vía ONG paraguas</div>
            <div className="access-card__title">Alerta WhatsApp</div>
            <p className="access-card__body">
              Mensaje automático cuando se detecta actividad en la cuenca de
              interés. Sin app, sin registro, sin almacenamiento del número.
              Funciona con 2G.
            </p>
            <ul className="access-card__list">
              <li><IconCheck size={14} stroke={2} /> ≤ 160 caracteres</li>
              <li><IconCheck size={14} stroke={2} /> Fallback SMS</li>
              <li><IconCheck size={14} stroke={2} /> Sin datos personales</li>
            </ul>
            <a
              href="mailto:contacto@freddyhg.org?subject=Solicitud%20de%20conexi%C3%B3n%20de%20guardian%C3%ADa"
              style={{ textDecoration: 'none', marginTop: 'var(--space-2)' }}
            >
              <Button
                variant="ghost"
                block
                iconRight={<IconArrowRight size={14} stroke={1.8} />}
              >
                Coordinar con ONG aliada
              </Button>
            </a>
          </article>
        </div>
      </section>

      {/* ─── DATOS ABIERTOS + STACK ─────────────────────── */}
      <section className="landing-section landing-section--tight">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'center' }} className="landing-final-grid">
          <div>
            <div className="landing-eyebrow">
              <span className="landing-eyebrow__line" />
              Diseñado para ser auditado
            </div>
            <h2 className="landing-h2">
              <span className="landing-h1__gold">Open source.</span><br />
              Reproducible.<br />
              Citable.
            </h2>
            <p className="landing-text" style={{ marginTop: 'var(--space-4)' }}>
              Cada alerta incluye el ID de la escena Sentinel-1 fuente y un hash
              SHA-256 verificable. <strong>Cualquier fiscal, juez o periodista</strong> puede
              reproducir la detección consultando la colección
              <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-gold)' }}> COPERNICUS/S1_GRD </code>
              en Google Earth Engine.
            </p>
            <p className="landing-text" style={{ marginTop: 'var(--space-3)' }}>
              El código completo del pipeline, el backend y este frontend está
              publicado en GitHub bajo licencia Apache 2.0.
            </p>
            <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <a
                href="https://github.com/ByZocar/Freddy-Hg"
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Button variant="ghost" iconLeft={<IconExternalLink size={14} stroke={1.5} />}>
                  Ver repositorio
                </Button>
              </a>
              <a
                href="https://freddy-hg-backend-production.up.railway.app/docs"
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Button variant="ghost" iconLeft={<IconDatabase size={14} stroke={1.5} />}>
                  Documentación API
                </Button>
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <IconShieldCheck size={22} stroke={1.5} color="var(--color-brand-gold)" />
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 'var(--fs-body-lg)', color: 'var(--text-primary)' }}>
                    Cadena de custodia digital
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: 2 }}>
                    Cada alerta lleva un SHA-256 verificable por terceros.
                  </div>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <IconWaveSawTool size={22} stroke={1.5} color="var(--color-brand-gold)" />
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 'var(--fs-body-lg)', color: 'var(--text-primary)' }}>
                    Datos públicos del Estado
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: 2 }}>
                    Concesiones ANM y resguardos RAISG cruzados en tiempo real.
                  </div>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <IconFileDownload size={22} stroke={1.5} color="var(--color-brand-gold)" />
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 'var(--fs-body-lg)', color: 'var(--text-primary)' }}>
                    Compatible con Ley 1333/2009
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: 2 }}>
                    PDF con todos los metadatos exigidos por el proceso sancionatorio.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__brand">
            <Wordmark variant="small" />
            <p className="landing-footer__tagline">
              Sistema de alerta temprana satelital para detectar minería ilegal
              de oro y riesgo de contaminación por mercurio en la Amazonía
              colombiana.
            </p>
          </div>
          <div className="landing-footer__col">
            <h4>Producto</h4>
            <ul>
              <li><a href="#solucion">Cómo funciona</a></li>
              <li><a href="#usuarios">Para quién es</a></li>
              <li><a href="#acceso">Acceso</a></li>
              <li><Link to="/public">Portal público</Link></li>
            </ul>
          </div>
          <div className="landing-footer__col">
            <h4>Recursos</h4>
            <ul>
              <li>
                <a
                  href="https://github.com/ByZocar/Freddy-Hg"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://freddy-hg-backend-production.up.railway.app/docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  API Docs
                </a>
              </li>
              <li><Link to="/docs/accuracy">Precisión &amp; falsos positivos</Link></li>
              <li><a href="#problema">Investigación</a></li>
            </ul>
          </div>
          <div className="landing-footer__col">
            <h4>Datos</h4>
            <ul>
              <li>Sentinel-1 ESA / Copernicus</li>
              <li>ANM Colombia · datos.gov.co</li>
              <li>RAISG · resguardos indígenas</li>
              <li>HydroSHEDS · WorldPop</li>
            </ul>
          </div>
        </div>
        <div className="landing-footer__bottom">
          <span>Freddy Hg · 2026 · Apache License 2.0</span>
          <span>
            Datos abiertos CC BY 4.0 · Sin afiliación gubernamental directa
          </span>
        </div>
      </footer>
    </div>
  );
}
