-- ☿ FREDDY Hg — Schema inicial
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- O ejecutar con: python backend/scripts/apply_schema.py (requiere POSTGRES_PASSWORD en .env)

-- ──────────────────────────────────────────────────────────────────
-- 0. Extensiones
-- ──────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────────
-- 1. Tabla principal de alertas
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scene_id TEXT NOT NULL,
  scene_date_utc TIMESTAMPTZ NOT NULL,
  centroid_lat FLOAT NOT NULL,
  centroid_lon FLOAT NOT NULL,
  centroid_geom GEOMETRY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(centroid_lon, centroid_lat), 4326)
  ) STORED,
  backscatter_vv FLOAT,
  area_m2 FLOAT,
  pixel_count INT,
  is_new_activity BOOLEAN DEFAULT true,
  confidence_level INT CHECK (confidence_level BETWEEN 1 AND 3),
  legal_status TEXT CHECK (legal_status IN ('concesion_activa', 'ilegal_presunto', 'verificar')),
  concession_id TEXT,
  indigenous_territory TEXT,
  indigenous_nation TEXT,
  requires_ddhh_protocol BOOLEAN DEFAULT false,
  downstream_basins JSONB,
  population_exposed_50km INT,
  downstream_territories JSONB,
  sha256_evidence TEXT NOT NULL,
  alert_url TEXT,
  geotiff_url TEXT,
  detection_source TEXT DEFAULT 'Sentinel-1 SAR',
  -- Campos Sprint 3.5 (Mistral)
  mistral_context TEXT,
  mistral_model TEXT,
  enriched_at TIMESTAMPTZ,
  impact_metrics JSONB
);

-- ──────────────────────────────────────────────────────────────────
-- 2. Organizaciones (CARs, ONGs, Fiscalía)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('CAR', 'ONG', 'FISCALIA', 'INVESTIGACION')),
  contact_email TEXT,
  roi_bounds JSONB,
  alert_level_threshold INT DEFAULT 2
);

-- ──────────────────────────────────────────────────────────────────
-- 3. Destinatarios WhatsApp / SMS
--    NUNCA almacenar el teléfono en claro. Solo hash + referencia.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number_hash TEXT NOT NULL,
  phone_secret_ref TEXT,
  basin_ids JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────
-- 4. Estados de alerta (workflow del funcionario CAR)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  state TEXT CHECK (state IN ('nueva', 'revisando', 'en_campo', 'medida_cautelar', 'archivado', 'falso_positivo')),
  notes TEXT,
  field_photos JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID
);

-- ──────────────────────────────────────────────────────────────────
-- 5. Auditoría inmutable (cadena de eventos)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  alert_id UUID,
  organization_id UUID,
  user_id UUID,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────
-- 6. Índices
-- ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_alerts_geom ON alerts USING GIST (centroid_geom);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_confidence ON alerts (confidence_level);
CREATE INDEX IF NOT EXISTS idx_alerts_legal_status ON alerts (legal_status);
CREATE INDEX IF NOT EXISTS idx_alert_states_alert ON alert_states (alert_id);
CREATE INDEX IF NOT EXISTS idx_audit_alert ON audit_log (alert_id);

-- ──────────────────────────────────────────────────────────────────
-- 7. Row Level Security (RLS)
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Política: alertas con confidence>=2 son legibles por TODOS los usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can read alerts" ON alerts;
CREATE POLICY "Authenticated users can read alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (true);

-- Política: lectura pública (alertas con >=30 días, para periodistas)
DROP POLICY IF EXISTS "Public can read alerts older than 30 days" ON alerts;
CREATE POLICY "Public can read alerts older than 30 days"
  ON alerts FOR SELECT
  TO anon
  USING (created_at < NOW() - INTERVAL '30 days');

-- Política: solo service_role puede insertar alertas (es el backend)
DROP POLICY IF EXISTS "Service role inserts alerts" ON alerts;
CREATE POLICY "Service role inserts alerts"
  ON alerts FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Política: usuarios autenticados pueden insertar estados (cambios)
DROP POLICY IF EXISTS "Authenticated users can insert states" ON alert_states;
CREATE POLICY "Authenticated users can insert states"
  ON alert_states FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política: usuarios autenticados pueden leer estados
DROP POLICY IF EXISTS "Authenticated users can read states" ON alert_states;
CREATE POLICY "Authenticated users can read states"
  ON alert_states FOR SELECT
  TO authenticated
  USING (true);

-- Política: lectura de organizaciones
DROP POLICY IF EXISTS "Authenticated users can read organizations" ON organizations;
CREATE POLICY "Authenticated users can read organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

-- ──────────────────────────────────────────────────────────────────
-- 8. View pública (para /public dashboard sin login)
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public_alerts AS
SELECT
  id,
  created_at,
  scene_date_utc,
  centroid_lat,
  centroid_lon,
  confidence_level,
  legal_status,
  indigenous_territory,
  area_m2,
  is_new_activity,
  detection_source,
  sha256_evidence
FROM alerts
WHERE created_at < NOW() - INTERVAL '30 days'
  AND confidence_level >= 2;

GRANT SELECT ON public_alerts TO anon;

-- ──────────────────────────────────────────────────────────────────
-- 9. Función para hash de teléfono (consistente con backend)
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION hash_phone(phone TEXT) RETURNS TEXT AS $$
  SELECT encode(digest(phone, 'sha256'), 'hex');
$$ LANGUAGE SQL IMMUTABLE;
