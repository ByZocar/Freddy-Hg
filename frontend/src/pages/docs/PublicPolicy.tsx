/**
 * ☿ FREDDY Hg — /docs/public-policy
 *
 * Politica publica de latencia tier — explicacion + cuantificacion de
 * lo que cada nivel evita o salva. Cumple el principio de diseno #5:
 * la politica sobre datos sensibles tiene que ser publica y razonada,
 * no una caja negra.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconExternalLink, IconScale } from '@tabler/icons-react';
import Wordmark from '../../components/brand/Wordmark';
import { Button } from '../../components/ui/Button';

export default function PublicPolicy() {
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
          <Link to="/docs/accuracy" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 'var(--fs-body)' }}>
            Precisión
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

        <div className="docs-eyebrow">Documentación pública · Política de transparencia</div>
        <h1 className="docs-h1">
          Latencia pública<br/>
          <span style={{ color: 'var(--color-brand-gold)' }}>por niveles y por sentencia</span>
        </h1>
        <p className="docs-lead">
          Freddy Hg publica cada alerta al público en una ventana de tiempo que
          depende del nivel de confianza y del estatus legal del territorio.
          Esta página documenta esa política y por qué cada parámetro existe.
          No es una caja negra: el código que la implementa está abierto en{' '}
          <a
            href="https://github.com/ByZocar/Freddy-Hg/blob/main/backend/sql/005_public_alerts_tiered_latency.sql"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--color-brand-gold)' }}
          >
            backend/sql/005_public_alerts_tiered_latency.sql
          </a>.
        </p>

        <div className="docs-meta">
          <span><b>Versión de la política:</b> 1.1</span>
          <span><b>Última revisión:</b> Mayo 2026</span>
          <span><b>Frecuencia de revisión:</b> trimestral</span>
        </div>

        <div className="docs-toc">
          <h4>En esta página</h4>
          <ol>
            <li><a href="#politica">La política en una tabla</a></li>
            <li><a href="#sentencia">Override por sentencia constitucional</a></li>
            <li><a href="#porque">Por qué hay latencia (y por qué no más)</a></li>
            <li><a href="#cuantificacion">Cuánto evita cada nivel</a></li>
            <li><a href="#industria">Comparativa con la industria</a></li>
            <li><a href="#apelacion">Cómo apelar para publicación anticipada</a></li>
            <li><a href="#referencias">Referencias</a></li>
          </ol>
        </div>

        {/* === 1. LA POLITICA === */}
        <h2 className="docs-h2" id="politica">1. La política, en una tabla</h2>
        <p>
          Cada alerta entra a la cola pública según la siguiente regla. Sólo
          dos parámetros entran al cálculo: nivel de confianza del modelo y
          territorio donde cae la coordenada.
        </p>

        <table className="docs-table">
          <thead>
            <tr>
              <th>Caso</th>
              <th>Latencia hasta publicación</th>
              <th>Razón</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style={{ color: 'var(--text-critical)' }}>Nivel 3</strong> crítico (SAR + cambio histórico + territorio indígena)</td>
              <td><code>48 horas</code></td>
              <td>Alta confianza (cruce triple) y ya con protocolo DD.HH. activado: prioridad de exposición pública sobre delay precautorio.</td>
            </tr>
            <tr>
              <td><strong style={{ color: 'var(--text-warning)' }}>Nivel 2</strong> advertencia (SAR + cambio histórico)</td>
              <td><code>7 días</code></td>
              <td>Estándar de la industria (GLAD / GFW). Ventana razonable de verificación de campo por la CAR antes de publicar.</td>
            </tr>
            <tr>
              <td><strong style={{ color: 'var(--color-brand-gold)' }}>Nivel 1</strong> monitor (solo SAR)</td>
              <td><code>30 días</code></td>
              <td>FPR alto en este nivel; publicar a 7 días contaminaría el feed con candidatos no verificados.</td>
            </tr>
            <tr>
              <td><strong>Override</strong> · territorios bajo sentencia (T-106/25, T-622/16, PNN Río Puré)</td>
              <td><code>inmediato</code></td>
              <td>La Corte Constitucional ya ordenó transparencia en tiempo real. La latencia precautoria es <em>contra legem</em> en estos casos.</td>
            </tr>
          </tbody>
        </table>

        <div className="docs-callout docs-callout--info">
          <p>
            <strong>Por debajo de la latencia:</strong> la alerta sigue
            visible para la CAR autenticada en el dashboard institucional,
            y se dispara el WhatsApp al guardián indígena local desde el
            primer minuto. La latencia <strong>no afecta a quien tiene que
            actuar</strong>; sólo gobierna cuándo se hace abierta al público
            general.
          </p>
        </div>

        {/* === 2. OVERRIDE === */}
        <h2 className="docs-h2" id="sentencia"><IconScale size={20} stroke={1.5} style={{ verticalAlign: 'middle', marginRight: 6 }}/>2. Override por sentencia constitucional</h2>
        <p>
          Tres marcos legales colombianos imponen transparencia
          inmediata en territorios específicos. Freddy Hg los reconoce
          explícitamente y publica esas alertas sin delay:
        </p>
        <ul>
          <li>
            <strong>T-106/25 — Jaguares del Yuruparí.</strong> La Corte
            Constitucional ordenó a 27 entidades estatales monitoreo en
            tiempo real de minería ilegal en el resguardo Yaigojé-Apaporis
            y territorios conexos. Cualquier alerta dentro de ese polígono
            es pública desde el minuto cero.
          </li>
          <li>
            <strong>T-622/16 — Río Atrato sujeto de derechos.</strong>{' '}
            Declara al río como sujeto de derechos bioculturales. El
            principio precautorio aquí <em>obliga</em> a la exposición
            inmediata para activar guardianes y operadores judiciales.
          </li>
          <li>
            <strong>PNN Río Puré — pueblo Yuri-Passé en aislamiento.</strong>{' '}
            Por norma del Plan de Manejo y por el Decreto 1232/2018 sobre
            pueblos en aislamiento voluntario, cualquier afectación
            requiere alerta inmediata a Parques Nacionales y a la
            Mesa Indígena Amazónica.
          </li>
        </ul>

        {/* === 3. POR QUE === */}
        <h2 className="docs-h2" id="porque">3. Por qué hay latencia (y por qué no más)</h2>
        <p>
          La pregunta legítima es: <em>si tienes el dato, ¿por qué no
          publicarlo todo, ya?</em> La respuesta corta: porque hay tres
          riesgos reales y dos de ellos se mitigan con un delay corto.
        </p>

        <h3 className="docs-h3">a) Riesgo de identificación de informantes</h3>
        <p>
          En Colombia, en 2023, fueron asesinados <strong>79
          defensores ambientales</strong> según Global Witness; un tercio
          en conflictos por minería y tierra. Cuando una alerta se publica
          el mismo día que el operador ilegal sigue en el sitio, las
          comunidades vecinas pueden ser señaladas como informantes,
          aunque la detección haya sido satelital. Una latencia mínima
          (48 h en nivel 3) rompe esa asociación temporal.
        </p>

        <h3 className="docs-h3">b) Ventana operativa de la CAR / Fiscalía</h3>
        <p>
          Una vez publicada la alerta, los operadores tienen incentivo a
          desmantelar evidencia o trasladar la draga. Para que el
          procedimiento sancionatorio (Ley 1333/2009) prospere, el
          inspector necesita encontrar la draga en el sitio. 48 horas a
          7 días es suficiente para coordinar un sobrevuelo o una
          inspección sin perder el caso.
        </p>

        <h3 className="docs-h3">c) Filtrado de falsos positivos</h3>
        <p>
          Los candidatos nivel 1 tienen tasa de FP cercana al 30%
          (ver{' '}
          <Link to="/docs/accuracy" style={{ color: 'var(--color-brand-gold)' }}>página de precisión</Link>
          ). Publicar antes de revisión humana erosiona la credibilidad
          del feed y del medio que lo cite. 30 días le da tiempo a las
          CARs piloto para marcarlos como confirmados o descartados.
        </p>

        <div className="docs-callout docs-callout--info">
          <p>
            <strong>Por qué 30 días <em>no</em> es el default global.</strong>{' '}
            En versiones anteriores Freddy Hg publicaba todas las alertas
            con 30 días de retraso. Era conservador-pero-no-defendible:
            castigaba la transparencia donde la sentencia ya la ordena
            y donde el nivel 3 ya está semánticamente verificado. La
            política tier resuelve esos casos sin renunciar a la
            protección donde sí hace falta.
          </p>
        </div>

        {/* === 4. CUANTIFICACION === */}
        <h2 className="docs-h2" id="cuantificacion">4. Cuánto evita cada nivel</h2>
        <p>
          Las cifras siguientes son <strong>estimaciones de orden de
          magnitud</strong> basadas en la literatura citada. No son
          mediciones experimentales propias.
        </p>

        <h3 className="docs-h3">Mercurio vertido por draga activa</h3>
        <p>
          Una draga aurífera fluvial estándar (15–25 m, motobomba +
          amalgamador) vierte entre <strong>5 y 15 kg de mercurio
          metálico al día</strong> mientras opera (Marrugo-Negrete et al.,
          U. de Córdoba, 2019). De ese mercurio,{' '}
          <strong>~40% llega al sistema acuático</strong> como metilmercurio
          en pocas semanas (UNEP Mercury Programme, 2019).
        </p>

        <table className="docs-table">
          <thead>
            <tr>
              <th>Escenario</th>
              <th>Hg vertido antes de la primera acción</th>
              <th>Población aguas abajo en riesgo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sin Freddy Hg (status quo, latencia institucional &gt;90 días)</td>
              <td><code>~450 – 1.350 kg Hg</code></td>
              <td>Población acumulada a 50 km · ~1.000 personas / kg Hg</td>
            </tr>
            <tr>
              <td>Con Freddy Hg, nivel 3 (alerta + WhatsApp en &lt;1 h, público en 48 h)</td>
              <td><code>~10 – 30 kg Hg</code></td>
              <td>Reducción ~97% en exposición acumulada</td>
            </tr>
            <tr>
              <td>Con Freddy Hg, nivel 2 (alerta + WhatsApp en &lt;1 h, público en 7 días)</td>
              <td><code>~35 – 105 kg Hg</code></td>
              <td>Reducción ~92%</td>
            </tr>
          </tbody>
        </table>

        <div className="docs-callout docs-callout--info">
          <p>
            <strong>Lo que <em>realmente</em> evita el sistema</strong>{' '}
            no es la latencia pública: es la combinación de
            <em> WhatsApp inmediato al guardián + email al funcionario CAR + PDF
            evidencia</em> que se disparan en el mismo minuto en que el
            pipeline marca la alerta. La latencia pública gobierna
            <strong>cuándo</strong> se vuelve abierta al periodismo y al
            público — no <strong>cuándo</strong> se actúa.
          </p>
        </div>

        <h3 className="docs-h3">Defensores ambientales protegidos</h3>
        <p>
          La latencia tier reduce la asociación temporal entre la
          ubicación publicada y la comunidad vecina. Aplicando la tasa de
          retaliación documentada (~15% de los casos post-disclosure según
          OPIAC, Mongabay 2024) a un escenario conservador de 80 alertas
          nivel 3 al año en territorio indígena, el delay de 48 h modela
          una reducción esperada de <strong>~5–8 incidentes de
          intimidación / amenaza por año</strong> contra guardianes
          asociados. Es un estimado proxy — no una garantía.
        </p>

        {/* === 5. INDUSTRIA === */}
        <h2 className="docs-h2" id="industria">5. Comparativa con la industria</h2>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Plataforma</th>
              <th>Latencia pública típica</th>
              <th>Modelo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Freddy Hg</strong></td>
              <td><code>48 h / 7 d / 30 d</code> + override</td>
              <td>Tier por confianza, override por sentencia.</td>
            </tr>
            <tr>
              <td>GLAD / Global Forest Watch</td>
              <td><code>~7 días</code></td>
              <td>Latencia técnica por reprocesamiento. No es policy.</td>
            </tr>
            <tr>
              <td>MAAP (Amazon Conservation)</td>
              <td><code>semanas a meses</code></td>
              <td>Reportes investigativos, no feed.</td>
            </tr>
            <tr>
              <td>Amazon Mining Watch</td>
              <td><code>mensual</code></td>
              <td>Mapa actualizado, sin tiempo real.</td>
            </tr>
            <tr>
              <td>SkyTruth</td>
              <td><code>quincenal o más</code></td>
              <td>Variable según caso.</td>
            </tr>
          </tbody>
        </table>

        {/* === 6. APELACION === */}
        <h2 className="docs-h2" id="apelacion">6. Cómo apelar para publicación anticipada</h2>
        <p>
          Si eres periodista, fiscal, líder comunitario u organización
          paraguas y necesitas acceso anticipado a una alerta específica
          (por ejemplo, para un reportaje en curso o un proceso
          sancionatorio inminente), escribe a{' '}
          <a href="mailto:alertas@freddyhg.org" style={{ color: 'var(--color-brand-gold)' }}>
            alertas@freddyhg.org
          </a>{' '}
          con:
        </p>
        <ol>
          <li>El ID de la alerta (formato <code>ALERT-XXXXXXXX</code>) o sus coordenadas.</li>
          <li>Tu identidad institucional verificable (medio, ONG, CAR, fiscalía).</li>
          <li>El uso previsto (reportaje, proceso administrativo, comunicación comunitaria).</li>
        </ol>
        <p>
          La decisión la tomamos en menos de 24 h y queda registrada en el
          log de auditoría público. Si la respuesta es negativa, te damos
          la razón por escrito.
        </p>

        {/* === REFERENCIAS === */}
        <h2 className="docs-h2" id="referencias">Referencias</h2>
        <ul>
          <li>
            Global Witness (2024). <em>Standing firm: The Land and
            Environmental Defenders on the frontlines of the climate
            crisis.</em>
          </li>
          <li>
            Defensoría del Pueblo de Colombia (2024). <em>Informe
            defensorial sobre contaminación por mercurio en el Chocó.</em>
          </li>
          <li>
            Marrugo-Negrete, J. et al. (2019). <em>Mercury contamination by
            artisanal gold mining in Colombian rivers.</em> Universidad de
            Córdoba.
          </li>
          <li>
            UNEP (2019). <em>Global Mercury Assessment.</em>
          </li>
          <li>
            Corte Constitucional de Colombia (2025). <em>Sentencia
            T-106/25 — Jaguares del Yuruparí.</em>
          </li>
          <li>
            Corte Constitucional de Colombia (2016). <em>Sentencia
            T-622/16 — Río Atrato como sujeto de derechos.</em>
          </li>
          <li>
            OPIAC / Mongabay (2024). <em>Retaliación contra monitores
            indígenas en la Amazonía colombiana — análisis de 14 casos.</em>
          </li>
          <li>
            Global Forest Watch (2024). <em>GLAD alert system technical
            documentation.</em>
          </li>
        </ul>

        <footer className="docs-footer">
          <p>
            Esta política se revisa trimestralmente. Los cambios se
            anuncian en el feed público y quedan versionados en{' '}
            <a
              href="https://github.com/ByZocar/Freddy-Hg/commits/main/backend/sql/005_public_alerts_tiered_latency.sql"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-brand-gold)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              GitHub <IconExternalLink size={12} stroke={1.5} />
            </a>.
          </p>
        </footer>
      </article>
    </div>
  );
}
