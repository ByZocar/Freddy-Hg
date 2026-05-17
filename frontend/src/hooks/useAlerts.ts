import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export interface Alert {
  id: string;
  created_at: string;
  scene_id: string;
  scene_date_utc: string;
  centroid_lat: number;
  centroid_lon: number;
  backscatter_vv: number | null;
  area_m2: number | null;
  pixel_count: number | null;
  confidence_level: number | null;
  legal_status: string | null;
  concession_id: string | null;
  indigenous_territory: string | null;
  indigenous_nation: string | null;
  requires_ddhh_protocol: boolean;
  is_new_activity: boolean;
  sha256_evidence: string;
  alert_url: string | null;
  detection_source: string;
  mistral_context: string | null;
  impact_metrics: {
    mercury_kg?: number;
    damage_usd?: number;
    people_at_risk?: number;
  } | null;
}

export function useAlerts(filters: { confidenceMin?: number; legalStatus?: string; indigenousOnly?: boolean } = {}) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      let q = supabase
        .from('alerts')
        .select('*')
        .gte('confidence_level', filters.confidenceMin ?? 1)
        .order('created_at', { ascending: false })
        .limit(500);
      if (filters.legalStatus) q = q.eq('legal_status', filters.legalStatus);
      if (filters.indigenousOnly) q = q.eq('requires_ddhh_protocol', true);
      const { data, error } = await q;
      if (!mounted) return;
      if (error) {
        setError(error.message);
        setAlerts([]);
      } else {
        setAlerts((data ?? []) as Alert[]);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [filters.confidenceMin, filters.legalStatus, filters.indigenousOnly]);

  return { alerts, loading, error };
}
