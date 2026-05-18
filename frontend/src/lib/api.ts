/**
 * ☿ FREDDY Hg — API client
 * Wrapper minimal sobre fetch para llamar al backend FastAPI.
 */
import { supabase } from '../supabaseClient';

const BASE = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '';

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function downloadPdf(alertId: string): Promise<Blob> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/api/export/pdf/${alertId}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) {
    throw new Error(`Error al generar PDF: ${res.status}`);
  }
  return res.blob();
}

export async function updateAlertState(alertId: string, state: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/api/alerts/${alertId}/state`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ state }),
  });
  if (!res.ok) {
    throw new Error(`Error al actualizar estado: ${res.status}`);
  }
}

export interface RecipientRow {
  id: string;
  organization_id: string | null;
  phone_number_hash: string;
  phone_last4: string | null;
  role: string | null;
  basin_ids: string[] | null;
  active: boolean;
  created_at: string;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((d: { msg?: string; loc?: unknown[] }) =>
          d?.msg ? `${(d.loc ?? []).join('.')}: ${d.msg}` : JSON.stringify(d),
        )
        .join('; ');
    }
    return JSON.stringify(data);
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function listRecipients(): Promise<RecipientRow[]> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/api/recipients`, { method: 'GET', headers });
  if (!res.ok) {
    throw new Error(`Error al listar destinatarios: ${await readError(res)}`);
  }
  const json = (await res.json()) as { recipients?: RecipientRow[] };
  return json.recipients ?? [];
}

export async function addRecipient(payload: {
  phone: string;
  role?: string;
  basins?: string[];
  organization_id?: string;
}): Promise<RecipientRow | null> {
  const headers = await authHeaders();
  const body = {
    phone_number: payload.phone,
    role: payload.role || null,
    basin_ids: payload.basins ?? [],
    organization_id: payload.organization_id ?? null,
  };
  const res = await fetch(`${BASE}/api/recipients`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Error al añadir destinatario: ${await readError(res)}`);
  }
  return (await res.json()) as RecipientRow;
}

export async function removeRecipient(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/api/recipients/${id}`, { method: 'DELETE', headers });
  if (!res.ok) {
    throw new Error(`Error al remover destinatario: ${await readError(res)}`);
  }
}

export function publicExportUrl(format: 'geojson' | 'csv'): string {
  return `${BASE}/api/alerts/export/${format}`;
}
