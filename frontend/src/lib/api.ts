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

export async function addRecipient(payload: {
  phone: string;
  role?: string;
  basins?: string[];
  organization_id?: string;
}): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/api/recipients`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Error al añadir destinatario: ${res.status}`);
  }
}

export async function removeRecipient(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/api/recipients/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    throw new Error(`Error al remover destinatario: ${res.status}`);
  }
}

export function publicExportUrl(format: 'geojson' | 'csv'): string {
  return `${BASE}/api/alerts/export/${format}`;
}
