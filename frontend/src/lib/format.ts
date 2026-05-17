/**
 * ☿ FREDDY Hg — Formatters
 * Utilidades de formateo de datos para consistencia visual en toda la UI.
 */

/**
 * Formato relativo en español: "hace 2h", "hace 3d", "hace 5sem"
 */
export function formatRelative(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD}d`;
  const diffW = Math.floor(diffD / 7);
  if (diffW < 8) return `hace ${diffW}sem`;
  const diffMo = Math.floor(diffD / 30);
  return `hace ${diffMo}m`;
}

/**
 * Formato UTC absoluto: "2026-05-15 · 10:23 UTC"
 */
export function formatUTC(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const iso = date.toISOString();
  return `${iso.slice(0, 10)} · ${iso.slice(11, 16)} UTC`;
}

/**
 * Formato fecha humana en español: "15 May 2026 · 10:23 UTC"
 */
export function formatHumanUTC(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const day = date.getUTCDate();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const h = String(date.getUTCHours()).padStart(2, '0');
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${h}:${m} UTC`;
}

/**
 * Coordenadas formateadas: "-0.1234°, -72.4567°"
 */
export function formatCoords(lat: number, lon: number, precision = 4): string {
  return `${lat.toFixed(precision)}°, ${lon.toFixed(precision)}°`;
}

/**
 * Trunca un hash SHA-256 manteniendo inicio y fin
 */
export function truncateHash(hash: string | undefined | null, chars = 8): string {
  if (!hash) return '—';
  if (hash.length <= chars * 2 + 1) return hash;
  return `${hash.slice(0, chars)}…${hash.slice(-chars)}`;
}

/**
 * Formatea números grandes con separadores: 5200 → "5.200"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('es-CO').format(Math.round(value));
}

/**
 * Formatea valor monetario USD: 48000 → "US$48.000"
 */
export function formatUSD(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (value >= 1_000_000) {
    return `US$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `US$${(value / 1_000).toFixed(1)}K`;
  }
  return `US$${formatNumber(value)}`;
}

/**
 * Mapea legal_status a label español
 */
export function legalStatusLabel(status: string | null | undefined): {
  short: string;
  long: string;
  tone: 'critical' | 'warning' | 'safe' | 'neutral';
} {
  switch (status) {
    case 'ilegal_presunto':
      return { short: 'ILEGAL', long: 'FUERA DE CONCESIÓN ACTIVA', tone: 'critical' };
    case 'concesion_activa':
      return { short: 'VIGENTE', long: 'DENTRO DE CONCESIÓN ACTIVA', tone: 'safe' };
    case 'verificar':
      return { short: 'VERIFICAR', long: 'ESTADO LEGAL PENDIENTE', tone: 'warning' };
    default:
      return { short: '—', long: 'Sin información', tone: 'neutral' };
  }
}

/**
 * Mapea confidence_level a tono semántico
 */
export function levelToTone(level: number | null | undefined): 'critical' | 'warning' | 'monitor' {
  if (level === 3) return 'critical';
  if (level === 2) return 'warning';
  return 'monitor';
}

/**
 * Genera iniciales a partir de un nombre o email
 */
export function getInitials(name: string | undefined | null): string {
  if (!name) return '—';
  const parts = name.includes('@') ? [name.split('@')[0]] : name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Detecta el nombre del río según coordenadas (simplificado por bounding box)
 */
export function inferRiverName(lat: number, lon: number): string {
  // Caquetá/Apaporis (Amazonas)
  if (lat >= -1.5 && lat <= 0.5 && lon >= -73.5 && lon <= -71.5) {
    return lat < -0.5 ? 'Río Apaporis' : 'Río Caquetá';
  }
  // Inírida (Guainía)
  if (lat >= 3.0 && lat <= 4.5 && lon >= -68.5 && lon <= -67.5) {
    return 'Río Inírida';
  }
  // Atrato (Chocó)
  if (lat >= 5.5 && lat <= 7.5 && lon >= -77.5 && lon <= -76.0) {
    return 'Río Atrato';
  }
  return 'Cuenca Amazónica';
}
