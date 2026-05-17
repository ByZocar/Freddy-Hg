/**
 * ☿ FREDDY Hg — Símbolo radial de 16 brazos
 *
 * Reimplementación en React del generador SVG definido en
 * FreddyHg_BrandGuidelines_Frontend.md sección 4.2.
 *
 * Representa simultáneamente: los ríos de la Amazonía vistos desde
 * satélite, la contaminación expandiéndose por las cuencas, un disco
 * de vinilo (Freddie Mercury) y un ojo satelital.
 *
 * El punto central negro es el origen del daño — donde cae la draga.
 *
 * Reglas (NO modificar):
 * - Brazos dorados (pares): #C8860A, stroke 2.0 * (size/80)
 * - Brazos plata (impares): #A0A0A0, stroke 1.5 * (size/80)
 * - 16 brazos exactos con curvatura orgánica predefinida
 * - El símbolo es estático en la UI (sin animación)
 */
interface Props {
  size?: number;
  darkBg?: boolean;
  /** Si true, hace el símbolo accesible por screen readers */
  title?: string;
  className?: string;
}

const NUM_ARMS = 16;
const CURVE_OFFSETS = [
  3.2, -2.4, 3.6, -2.8, 2.8, -3.4, 3.0, -2.2,
  3.4, -2.6, 2.6, -3.2, 3.2, -2.8, 2.8, -3.0,
];

export default function FreddyHgSymbol({
  size = 64,
  darkBg = true,
  title,
  className,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const innerRadius = size * 0.13;
  const outerRadius = size * 0.44;
  const ringRadius = outerRadius + size * 0.065;
  const dotRadius = size * 0.05;
  const dotColor = darkBg ? '#0A0804' : '#1A1208';

  const arms = [];
  for (let i = 0; i < NUM_ARMS; i++) {
    const angle = ((i * 360) / NUM_ARMS - 90) * (Math.PI / 180);
    const perpAngle = angle + Math.PI / 2;

    const startX = cx + innerRadius * Math.cos(angle);
    const startY = cy + innerRadius * Math.sin(angle);
    const endX = cx + outerRadius * Math.cos(angle);
    const endY = cy + outerRadius * Math.sin(angle);

    const midRadius = (innerRadius + outerRadius) * 0.46;
    const midX = cx + midRadius * Math.cos(angle);
    const midY = cy + midRadius * Math.sin(angle);
    const offset = CURVE_OFFSETS[i] * (size / 80);
    const ctrlX = midX + offset * Math.cos(perpAngle);
    const ctrlY = midY + offset * Math.sin(perpAngle);

    const isGold = i % 2 === 0;
    const color = isGold ? '#C8860A' : '#A0A0A0';
    const strokeWidth = (size / 80) * (isGold ? 2.0 : 1.5);

    arms.push(
      <path
        key={i}
        d={`M${startX.toFixed(1)},${startY.toFixed(1)} Q${ctrlX.toFixed(1)},${ctrlY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`}
        stroke={color}
        strokeWidth={strokeWidth.toFixed(2)}
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {title && <title>{title}</title>}
      {arms}
      <circle
        cx={cx}
        cy={cy}
        r={ringRadius.toFixed(1)}
        fill="none"
        stroke="rgba(200,134,10,0.18)"
        strokeWidth={((size / 80) * 0.5).toFixed(2)}
      />
      <circle cx={cx} cy={cy} r={dotRadius.toFixed(1)} fill={dotColor} />
    </svg>
  );
}
