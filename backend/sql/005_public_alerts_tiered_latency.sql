-- Politica de latencia publica por niveles + override por sentencia.
--
-- Reemplaza la regla anterior "todo publico a los 30 dias" por una
-- politica explicita y justificada:
--
--   Nivel 3 (critico)        -> visible al publico tras 48 horas
--   Nivel 2 (advertencia)    -> visible al publico tras 7 dias
--   Nivel 1 (monitor)        -> visible al publico tras 30 dias
--   Override por sentencia:  -> visible inmediatamente cuando la
--                              alerta cae en un territorio con
--                              mandato constitucional de transparencia
--                              (T-106/25 Yaiguje-Apaporis, T-622/16 Atrato,
--                              PNN Rio Pure / pueblos en aislamiento).
--
-- Rationale (resumen, ver /docs/public-policy):
--   - 30 dias era una latencia precautoria pero arbitraria; opaca para
--     periodistas y comunidades que la sentencia T-106/25 ya autoriza
--     a ver en tiempo real.
--   - El delay protege ventana operativa de la CAR y reduce riesgo de
--     identificacion de informantes — riesgos que se desactivan cuando
--     la transparencia ya esta judicialmente ordenada o cuando el caso
--     es nivel 3 (alta confianza, ya verificado por cruces ANM+RAISG).
--   - Alinea con la practica de la industria: GLAD/Global Forest Watch
--     publica con ~7 dias de lag por defecto; MAAP publica semanalmente.

-- Lista de patrones (ILIKE) con override de publicacion inmediata.
-- Se reusa en la RLS y en la vista para mantener una sola fuente.
CREATE OR REPLACE FUNCTION freddy_hg_is_public_now(
  p_confidence_level INT,
  p_created_at TIMESTAMPTZ,
  p_indigenous_territory TEXT,
  p_indigenous_nation TEXT
) RETURNS BOOLEAN AS $$
  SELECT
    -- 1) Override por sentencia constitucional / nacion en aislamiento
    (
      COALESCE(p_indigenous_territory, '') ILIKE ANY (ARRAY[
        '%apaporis%',          -- T-106/25 Jaguares del Yurupari
        '%yaigoj%',            -- variante con tilde fallada
        '%yurupar%',
        '%pn%pur%',            -- PNN Rio Pure (pueblos en aislamiento)
        '%pur%aislamiento%'
      ])
      OR COALESCE(p_indigenous_nation, '') ILIKE ANY (ARRAY[
        '%yuri-pass%',         -- Yuri-Passe en aislamiento
        '%atrato%',            -- T-622/16 Rio Atrato sujeto de derechos
        '%t-106%',
        '%t-622%'
      ])
    )
    -- 2) Tiered por nivel de confianza
    OR (p_confidence_level = 3 AND p_created_at < NOW() - INTERVAL '48 hours')
    OR (p_confidence_level = 2 AND p_created_at < NOW() - INTERVAL '7 days')
    OR (p_confidence_level = 1 AND p_created_at < NOW() - INTERVAL '30 days');
$$ LANGUAGE SQL STABLE;


-- Reemplazar la politica RLS para anon usando la nueva funcion.
DROP POLICY IF EXISTS "Public can read alerts older than 30 days" ON alerts;
DROP POLICY IF EXISTS "Public can read alerts per tiered latency policy" ON alerts;

CREATE POLICY "Public can read alerts per tiered latency policy"
  ON alerts FOR SELECT
  TO anon
  USING (
    freddy_hg_is_public_now(
      confidence_level,
      created_at,
      indigenous_territory,
      indigenous_nation
    )
  );


-- Reemplazar la vista publica con la misma logica
-- (la vista la consume el endpoint /api/public/alerts vis-a-vis periodistas).
DROP VIEW IF EXISTS public_alerts;

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
  indigenous_nation,
  area_m2,
  is_new_activity,
  detection_source,
  sha256_evidence,
  -- exponemos *por que* es publica esta fila (debug/transparencia)
  CASE
    WHEN COALESCE(indigenous_territory, '') ILIKE ANY (ARRAY['%apaporis%','%yaigoj%','%yurupar%','%pn%pur%','%pur%aislamiento%'])
      OR COALESCE(indigenous_nation, '') ILIKE ANY (ARRAY['%yuri-pass%','%atrato%','%t-106%','%t-622%'])
      THEN 'sentencia_override'
    WHEN confidence_level = 3 THEN 'tiered_48h'
    WHEN confidence_level = 2 THEN 'tiered_7d'
    ELSE 'tiered_30d'
  END AS public_reason
FROM alerts
WHERE freddy_hg_is_public_now(
  confidence_level,
  created_at,
  indigenous_territory,
  indigenous_nation
);

GRANT SELECT ON public_alerts TO anon;
GRANT SELECT ON public_alerts TO authenticated;


-- Verificacion rapida
DO $$
DECLARE
  total INT;
  visibles INT;
  override INT;
BEGIN
  SELECT COUNT(*) INTO total FROM alerts;
  SELECT COUNT(*) INTO visibles FROM public_alerts;
  SELECT COUNT(*) INTO override FROM public_alerts WHERE public_reason = 'sentencia_override';
  RAISE NOTICE 'Politica publica aplicada. Total alertas: %, Publicas: %, Por sentencia: %', total, visibles, override;
END $$;
