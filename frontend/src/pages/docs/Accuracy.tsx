/**
 * ☿ FREDDY Hg — /docs/accuracy
 *
 * Pagina publica con la nota de falsos positivos conocidos (NF-10).
 * Cumple el principio de diseno #5: transparencia del modelo es
 * no-negociable. Documentar errores aumenta la credibilidad ante
 * reguladores, jueces y la comunidad cientifica.
 *
 * Fuente de los numeros: T10_PoC_SAR_GEE.md + literatura cited.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconExternalLink } from '@tabler/icons-react';
import Wordmark from '../../components/brand/Wordmark';
import { Button } from '../../components/ui/Button';

export default function Accuracy() {
  useEffect(() => {
    document.body.classList.add('body--docs');
    document.body.style.overflow = 'auto';
    return () => {
      document.body.classList.remove('body--docs');
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="docs-shell">
      <header className="docs-nav">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Wordmark variant="navbar" />
        </Link>
        <div className="docs-nav__links">
          <Link to="/public" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 'var(--fs-body)' }}>
            Portal público
          </Link>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">Iniciar sesión</Button>
          </Link>
        </div>
      </header>

      <article className="docs-article">
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-small)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconArrowLeft size={14} stroke={1.5} /> Volver al inicio
          </Link>
        </div>

        <div className="docs-eyebrow">Documentación pública · Precisión del modelo</div>
        <h1 className="docs-h1">
          Falsos positivos<br/>
          <span style={{ color: 'var(--color-brand-gold)' }}>y los límites del sistema</span>
        </h1>
        <p className="docs-lead">
          Ningún sistema de detección satelital es perfecto. Esta página documenta
          honestamente las fuentes de error conocidas de Freddy Hg, cómo las
          identificamos y qué hacemos para minimizarlas. Es lectura obligatoria
          antes de usar los datos en cualquier proceso legal o de denuncia.
        </p>

        <div className="docs-meta">
          <span><b>Versión del algoritmo:</b> freddy-hg-v1.1</span>
          <span><b>Última actualización:</b> Mayo 2026</span>
          <span><b>Próxima revisión:</b> mensual</span>
        </div>

        <div className="docs-toc">
          <h4>En esta página</h4>
          <ol>
            <li><a href="#metricas-estimadas">Métricas de precisión estimadas</a></li>
            <li><a href="#fuentes-error">Cinco fuentes de error conocidas</a></li>
            <li><a href="#mitigaciones">Cómo las mitigamos</a></li>
            <li><a href="#niveles-confianza">Qué significan los niveles 1, 2 y 3</a></li>
            <li><a href="#metricas-impacto">Sobre las métricas de impacto (mercury_kg, USD, personas)</a></li>
            <li><a href="#mistral-context">Sobre el contexto generado por Mistral AI</a></li>
            <li><a href="#uso-legal">Recomendaciones para uso en proceso sancionatorio</a></li>
          </ol>
        </div>

        {/* === 1. METRICAS === */}
        <h2 className="docs-h2" id="metricas-estimadas">1. Métricas de precisión estimadas</h2>
        <p>
          Freddy Hg aplica un algoritmo de umbralización SAR sobre imágenes
          Sentinel-1 (banda C, polarización VV) similar al descrito por
          Schwartz et al. (2019, cuenca del Madeira, Brasil) y Goncalves et al.
          (2021, cuenca del Tapajós, Brasil). Para condiciones análogas a las
          colombianas, esos trabajos peer-reviewed reportan:
        </p>

        <table className="docs-table">
          <thead>
            <tr>
              <th>Estudio de referencia</th>
              <th>Cuenca</th>
              <th>TPR (recall)</th>
              <th>FPR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Schwartz et al. (2019)</td>
              <td>Río Madeira, Brasil</td>
              <td><code>~78%</code></td>
              <td><code>~22%</code></td>
            </tr>
            <tr>
              <td>Goncalves et al. (2021)</td>
              <td>Río Tapajós, Brasil</td>
              <td><code>~74%</code></td>
              <td><code>~31%</code></td>
            </tr>
          </tbody>
        </table>

        <div className="docs-callout docs-callout--critical">
          <p>
            <strong>Importante:</strong> Freddy Hg <strong>no ha sido validado independientemente</strong> sobre
            ríos amazónicos colombianos. Las cifras anteriores son proxies basados
            en literatura comparable, no mediciones propias. La calibración real
            requiere ground truth de campo, que estamos coordinando con las CARs
            piloto (Corpoamazonía y CDA).
          </p>
        </div>

        {/* === 2. FUENTES DE ERROR === */}
        <h2 className="docs-h2" id="fuentes-error">2. Cinco fuentes de error conocidas</h2>

        <h3 className="docs-h3">a) Bancos de arena dinámicos</h3>
        <p>
          En ríos trenzados como el Inírida y el Putumayo, los bancos de arena
          se exponen y se sumergen con el nivel del río, generando superficies
          rugosas con alta retrodispersión temporal. Pueden confundirse con
          objetos metálicos sobre el agua.
        </p>

        <h3 className="docs-h3">b) Embarcaciones de transporte legítimas</h3>
        <p>
          Chalupas, lanchas y pequeñas embarcaciones en tránsito generan picos
          de retrodispersión puntuales. La mediana multi-temporal reduce este
          ruido pero no lo elimina.
        </p>

        <h3 className="docs-h3">c) Infraestructura ribereña permanente</h3>
        <p>
          Muelles, campamentos, casas con techos metálicos en orillas pueden
          aparecer como objetos brillantes sobre la máscara de agua si el río
          ha cambiado su curso recientemente.
        </p>

        <h3 className="docs-h3">d) Distorsiones por layover y sombra de radar</h3>
        <p>
          En cañones selváticos estrechos con relieve pronunciado, el ángulo de
          incidencia del SAR genera artefactos geométricos. La cobertura
          Sentinel-1 sobre algunos tramos angostos del Caquetá puede sufrir
          este efecto.
        </p>

        <h3 className="docs-h3">e) Embalses y zonas inundadas estacionalmente</h3>
        <p>
          Áreas anegadas con vegetación parcialmente sumergida pueden generar
          dobles rebotes que se confunden con estructuras metálicas en agua.
        </p>

        {/* === 3. MITIGACIONES === */}
        <h2 className="docs-h2" id="mitigaciones">3. Cómo las mitigamos</h2>
        <ul>
          <li>
            <strong>Análisis de cambio vs. baseline 2018–2019:</strong> solo
            consideramos "actividad nueva" los puntos con cambio &gt; 5 dB respecto
            del baseline histórico. Esto descarta infraestructura permanente.
          </li>
          <li>
            <strong>Umbral de área mínima:</strong> requerimos al menos 2 píxeles
            contiguos de 10 m × 10 m (200 m²). Eso filtra picos puntuales de
            embarcaciones pequeñas.
          </li>
          <li>
            <strong>Máscara de agua estricta:</strong> solo evaluamos píxeles con
            <code> VV &lt; −15 dB</code> en el período actual.
          </li>
          <li>
            <strong>Filtro de speckle por mediana multi-temporal:</strong>{' '}
            usamos la mediana de las escenas Sentinel-1 del período en lugar de
            una sola imagen.
          </li>
          <li>
            <strong>Cruce contra concesiones ANM:</strong> los puntos dentro de
            títulos mineros vigentes se marcan como "concesión activa" y no como
            ilegal presunto.
          </li>
        </ul>

        {/* === 4. NIVELES DE CONFIANZA === */}
        <h2 className="docs-h2" id="niveles-confianza">4. Qué significan los niveles 1, 2 y 3</h2>
        <p>
          Toda alerta de Freddy Hg incluye un nivel de confianza que combina la
          señal SAR con cruces contextuales:
        </p>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Nivel</th>
              <th>Criterio</th>
              <th>Recomendación operativa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style={{ color: 'var(--color-brand-gold)' }}>1</strong></td>
              <td>Solo SAR. Fuera de concesión activa.</td>
              <td>Verificar antes de actuar.</td>
            </tr>
            <tr>
              <td><strong style={{ color: 'var(--text-warning)' }}>2</strong></td>
              <td>SAR + análisis de cambio histórico positivo.</td>
              <td>Iniciar inspección de campo.</td>
            </tr>
            <tr>
              <td><strong style={{ color: 'var(--text-critical)' }}>3</strong></td>
              <td>SAR + cambio histórico + intersección con resguardo indígena.</td>
              <td>Activar protocolo de DD.HH. (T-106/25). Medida cautelar urgente.</td>
            </tr>
          </tbody>
        </table>

        {/* === 5. METRICAS DE IMPACTO === */}
        <h2 className="docs-h2" id="metricas-impacto">5. Sobre las métricas de impacto</h2>
        <p>
          Cada alerta incluye estimaciones de <code>mercury_kg</code>,
          <code> damage_usd</code> y <code>people_at_risk</code>. Estas son{' '}
          <strong>estimaciones proxy</strong>, no mediciones directas:
        </p>

        <div className="docs-callout docs-callout--info">
          <p>
            <strong>Metodología (proxy):</strong> mercury_kg se calcula como{' '}
            <code>área_m² × 0.012 kg/m²</code> (Marrugo-Negrete et al.,
            Universidad de Córdoba, 2019). damage_usd usa el costo de
            remediación ambiental promedio reportado por el UNEP Mercury
            Programme (US$ 3 000 / kg Hg). people_at_risk es estimado por
            Mistral AI a partir del conocimiento general sobre densidad
            poblacional en cuencas amazónicas.
          </p>
        </div>

        <p>
          Estos números <strong>no deben usarse como evidencia técnica oficial</strong>{' '}
          para sanciones económicas. Sirven para priorizar respuesta operativa
          y para reportes narrativos a donantes / opinión pública. Para uso
          legal, la evidencia oficial es la imagen Sentinel-1 fuente, el hash
          SHA-256 verificable y el cruce contra el catastro ANM — todo eso sí es
          reproducible independientemente.
        </p>

        {/* === 6. MISTRAL === */}
        <h2 className="docs-h2" id="mistral-context">6. Sobre el contexto generado por Mistral AI</h2>
        <p>
          Cada alerta incluye un campo <code>mistral_context</code> generado por
          el modelo <code>mistralai/mistral-small-24b-instruct-2501</code> via
          OpenRouter. Este texto es <strong>generado por IA y puede contener
          imprecisiones</strong>. Lo proporcionamos como ayuda para entender el
          contexto regional general, no como fuente factual verificada.
        </p>
        <p>
          Si una alerta es importante para un proceso sancionatorio o reportaje,
          el equipo investigador debe verificar las afirmaciones del contexto
          contra fuentes primarias antes de citarlas.
        </p>

        {/* === 7. USO LEGAL === */}
        <h2 className="docs-h2" id="uso-legal">7. Recomendaciones para uso en proceso sancionatorio</h2>
        <p>
          Cuando se use una alerta de Freddy Hg en un proceso administrativo
          ambiental (Ley 1333/2009) o judicial:
        </p>
        <ol>
          <li>
            <strong>Adjunte el PDF generado</strong> directamente desde el
            dashboard. Incluye el SHA-256, el ID de escena Sentinel-1 fuente, el
            timestamp UTC y la coordenada exacta — todos los metadatos exigidos
            para evidencia digital admisible.
          </li>
          <li>
            <strong>Verifique la integridad del dato</strong> consultando la
            escena indicada en la colección{' '}
            <code>COPERNICUS/S1_GRD</code> de Google Earth Engine. El SHA-256 es
            reproducible por terceros.
          </li>
          <li>
            <strong>Realice inspección de campo</strong> antes de emitir medidas
            cautelares de mayor envergadura. Freddy Hg detecta la señal
            satelital, no confirma la actividad ilegal en sitio.
          </li>
          <li>
            <strong>No cite los números de impacto</strong> (mercury_kg,
            damage_usd, people_at_risk) como datos oficiales. Son estimaciones
            proxy útiles para priorización, no para sanciones económicas.
          </li>
          <li>
            <strong>Conserve el ID de alerta</strong> (<code>ALERT-XXXXXXXX</code>)
            para futuras referencias. La URL permanente es estable a 5 años.
          </li>
        </ol>

        {/* === REFERENCIAS === */}
        <h2 className="docs-h2" id="referencias">Referencias</h2>
        <ul>
          <li>
            Schwartz, S. et al. (2019). <em>Mapping illegal gold mining in the
            Amazon basin using Sentinel-1 SAR.</em> Remote Sensing of Environment.
          </li>
          <li>
            Goncalves, D. et al. (2021). <em>Monitoring artisanal mining with
            Sentinel-1 in the Tapajós region.</em> Int. J. of Remote Sensing.
          </li>
          <li>
            Marrugo-Negrete, J. et al. (2019). <em>Mercury contamination by
            artisanal gold mining in Colombian rivers.</em> U. de Córdoba.
          </li>
          <li>
            UNEP (2019). <em>Global Mercury Assessment.</em> United Nations
            Environment Programme.
          </li>
          <li>
            Corte Constitucional de Colombia (2025).{' '}
            <em>Sentencia T-106/25 — Jaguares del Yuruparí.</em>
          </li>
        </ul>

        <footer className="docs-footer">
          <p>
            Esta página se actualiza mensualmente con los resultados de
            validación en campo coordinada con las CARs piloto. La última
            modificación, el código fuente del algoritmo y los criterios de
            actualización están publicados en{' '}
            <a
              href="https://github.com/ByZocar/Freddy-Hg"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-brand-gold)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              github.com/ByZocar/Freddy-Hg <IconExternalLink size={12} stroke={1.5} />
            </a>
          </p>
          <p style={{ marginTop: 'var(--space-2)' }}>
            ¿Encontraste un error en esta página o quieres reportar un falso
            positivo confirmado en campo? Escribe a{' '}
            <a href="mailto:alertas@freddyhg.org" style={{ color: 'var(--color-brand-gold)' }}>
              alertas@freddyhg.org
            </a>{' '}
            o abre un issue en GitHub.
          </p>
        </footer>
      </article>
    </div>
  );
}
