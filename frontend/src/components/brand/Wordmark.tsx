/**
 * ☿ FREDDY Hg — Wordmark horizontal
 *
 * Combina el símbolo SVG con el texto "FREDDY Hg":
 * - "FREDDY" en Barlow Condensed 800 dorado
 * - " Hg" en Barlow Condensed 400 plata
 *
 * Variantes oficiales:
 * - hero: símbolo 80px, texto 72px (landing/login)
 * - large: símbolo 64px, texto 52px
 * - navbar: símbolo 28px, texto 24px (navegación)
 * - small: símbolo 22px, texto 20px (footers, badges)
 */
import FreddyHgSymbol from './FreddyHgSymbol';

type Variant = 'hero' | 'large' | 'navbar' | 'small';

interface Props {
  variant?: Variant;
  darkBg?: boolean;
  as?: 'div' | 'a' | 'span';
  href?: string;
  onClick?: () => void;
  /** Si true, oculta el texto y muestra solo el símbolo */
  symbolOnly?: boolean;
  ariaLabel?: string;
}

const SIZES: Record<Variant, { symbol: number; font: number; gap: number }> = {
  hero:   { symbol: 80, font: 72, gap: 16 },
  large:  { symbol: 64, font: 52, gap: 14 },
  navbar: { symbol: 28, font: 24, gap: 8 },
  small:  { symbol: 22, font: 20, gap: 6 },
};

export default function Wordmark({
  variant = 'navbar',
  darkBg = true,
  as = 'div',
  href,
  onClick,
  symbolOnly = false,
  ariaLabel = 'Freddy Hg',
}: Props) {
  const { symbol, font, gap } = SIZES[variant];

  const nameColor = darkBg ? '#C8860A' : '#7A5A08';
  const symColor = darkBg ? '#888888' : '#8A7A60';

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${gap}px`,
    lineHeight: 1,
    textDecoration: 'none',
    cursor: onClick || href ? 'pointer' : 'default',
    userSelect: 'none',
  };

  const content = (
    <>
      <FreddyHgSymbol size={symbol} darkBg={darkBg} title={ariaLabel} />
      {!symbolOnly && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            lineHeight: 1,
            fontFamily: 'var(--font-display)',
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: `${font}px`,
              color: nameColor,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}
          >
            FREDDY
          </span>
          <span
            style={{
              fontWeight: 400,
              fontSize: `${font}px`,
              color: symColor,
              letterSpacing: '0.03em',
              marginLeft: '0.25em',
            }}
          >
            Hg
          </span>
        </div>
      )}
    </>
  );

  if (as === 'a' && href) {
    return (
      <a href={href} style={containerStyle} aria-label={ariaLabel} onClick={onClick}>
        {content}
      </a>
    );
  }

  const Comp = as as 'div';
  return (
    <Comp style={containerStyle} aria-label={ariaLabel} onClick={onClick}>
      {content}
    </Comp>
  );
}
