-- Alertas históricas para que el dashboard se vea vivo entre corridas del pipeline.
-- Coordenadas tomadas de hotspots documentados públicamente:
--   * MAAP Project (maaproject.org): minería ilícita Apaporis/Caquetá/Puré/Yarí
--   * RAISG: invasiones mineras en territorios indígenas
--   * Mongabay / Reuters: dragas en Atrato e Inírida
-- Marcadas con scene_id 'DEMO-MAAP-*' para poder limpiarlas con un solo DELETE.
--
-- Re-ejecutable: limpia las suyas antes de insertar.

DELETE FROM alerts WHERE scene_id LIKE 'DEMO-MAAP-%';

INSERT INTO alerts (
  scene_id, scene_date_utc,
  centroid_lat, centroid_lon,
  backscatter_vv, area_m2, pixel_count, is_new_activity,
  confidence_level, legal_status,
  indigenous_territory, indigenous_nation, requires_ddhh_protocol,
  population_exposed_50km,
  sha256_evidence, detection_source, created_at
)
SELECT
  s.scene_id,
  s.scene_date_utc,
  s.lat, s.lon,
  s.backscatter, s.area_m2, s.pixels, true,
  s.confidence, s.legal,
  s.indigenous, s.nation, s.ddhh,
  s.pop_exposed,
  encode(digest('seed-' || s.scene_id, 'sha256'), 'hex'),
  'Sentinel-1 SAR',
  s.scene_date_utc
FROM (VALUES
  -- ── Río Apaporis (Vaupés) — fuente: MAAP #156, RAISG ─────────────
  ('DEMO-MAAP-APO-001', NOW() - INTERVAL '11 months 12 days', -0.6320::float, -71.2845::float, -9.8::float, 412::float, 5::int, 2::int, 'ilegal_presunto', 'Yaigojé Apaporis', 'Macuna', true, 1820::int),
  ('DEMO-MAAP-APO-002', NOW() - INTERVAL '10 months  3 days', -0.5901, -71.1130, -8.9, 287, 4, 1, 'verificar',        'Yaigojé Apaporis', 'Macuna', true, 1820),
  ('DEMO-MAAP-APO-003', NOW() - INTERVAL  '9 months 18 days', -0.7411, -71.4502, -7.4, 638, 8, 3, 'ilegal_presunto', 'Yaigojé Apaporis', 'Tanimuka', true, 2110),
  ('DEMO-MAAP-APO-004', NOW() - INTERVAL  '7 months  9 days', -0.6810, -71.3098, -9.1, 318, 4, 2, 'ilegal_presunto', 'Yaigojé Apaporis', 'Macuna', true, 1820),
  ('DEMO-MAAP-APO-005', NOW() - INTERVAL  '4 months 27 days', -0.5230, -71.0501, -8.0, 552, 7, 2, 'ilegal_presunto', 'Yaigojé Apaporis', 'Macuna', true, 1820),
  ('DEMO-MAAP-APO-006', NOW() - INTERVAL  '2 months 14 days', -0.6022, -71.2210, -7.8, 712, 9, 3, 'ilegal_presunto', 'Yaigojé Apaporis', 'Macuna', true, 1820),
  ('DEMO-MAAP-APO-007', NOW() - INTERVAL    '38 days',         -0.5645, -71.1689, -8.6, 397, 5, 2, 'verificar',        'Yaigojé Apaporis', 'Macuna', true, 1820),

  -- ── Río Caquetá / Yarí — fuente: MAAP #131, prensa colombiana ────
  ('DEMO-MAAP-CAQ-001', NOW() - INTERVAL '11 months  2 days',  0.1102, -72.4480, -9.2, 345, 4, 2, 'verificar',        'PNN La Paya', NULL, false, 3450),
  ('DEMO-MAAP-CAQ-002', NOW() - INTERVAL  '9 months  4 days',  0.0531, -72.5022, -8.4, 489, 6, 2, 'ilegal_presunto', 'PNN La Paya', NULL, false, 3450),
  ('DEMO-MAAP-CAQ-003', NOW() - INTERVAL  '6 months 21 days',  0.2814, -73.0107, -7.5, 612, 8, 3, 'ilegal_presunto', NULL, NULL, false, 2940),
  ('DEMO-MAAP-CAQ-004', NOW() - INTERVAL  '5 months  6 days',  0.4001, -73.2241, -9.6, 271, 3, 1, 'verificar',        NULL, NULL, false, 2940),
  ('DEMO-MAAP-CAQ-005', NOW() - INTERVAL  '3 months 11 days',  0.1545, -72.8108, -8.2, 540, 7, 2, 'ilegal_presunto', NULL, NULL, false, 2940),
  ('DEMO-MAAP-CAQ-006', NOW() - INTERVAL    '49 days',          0.0782, -72.5570, -7.9, 478, 6, 2, 'ilegal_presunto', 'PNN La Paya', NULL, false, 3450),
  ('DEMO-MAAP-CAQ-007', NOW() - INTERVAL    '17 days',          0.2110, -72.9332, -8.8, 312, 4, 2, 'verificar',        NULL, NULL, false, 2940),

  -- ── Río Puré (Amazonas) — fuente: MAAP, pueblo aislado Yuri-Passé ─
  ('DEMO-MAAP-PUR-001', NOW() - INTERVAL '10 months 24 days', -1.4810, -69.8742, -7.3, 698, 9, 3, 'ilegal_presunto', 'PNN Río Puré', 'Yuri-Passé (aislamiento)', true, 480),
  ('DEMO-MAAP-PUR-002', NOW() - INTERVAL  '8 months 12 days', -1.5302, -69.9301, -8.1, 521, 7, 3, 'ilegal_presunto', 'PNN Río Puré', 'Yuri-Passé (aislamiento)', true, 480),
  ('DEMO-MAAP-PUR-003', NOW() - INTERVAL  '5 months 23 days', -1.4498, -69.8121, -7.8, 588, 7, 3, 'ilegal_presunto', 'PNN Río Puré', 'Yuri-Passé (aislamiento)', true, 480),
  ('DEMO-MAAP-PUR-004', NOW() - INTERVAL  '2 months  8 days', -1.5045, -69.9008, -9.0, 364, 5, 2, 'ilegal_presunto', 'PNN Río Puré', 'Yuri-Passé (aislamiento)', true, 480),
  ('DEMO-MAAP-PUR-005', NOW() - INTERVAL    '22 days',         -1.4720, -69.8920, -7.6, 605, 8, 3, 'ilegal_presunto', 'PNN Río Puré', 'Yuri-Passé (aislamiento)', true, 480),

  -- ── Río Inírida (Guainía) — fuente: prensa, RAISG ────────────────
  ('DEMO-MAAP-INI-001', NOW() - INTERVAL '11 months 28 days',  3.7522, -68.0211, -8.7, 402, 5, 2, 'verificar',        'Resguardo Caranacoa', 'Curripaco', false, 950),
  ('DEMO-MAAP-INI-002', NOW() - INTERVAL  '8 months  1 day',   3.8814, -67.9132, -7.4, 624, 8, 3, 'ilegal_presunto', NULL, NULL, false, 1240),
  ('DEMO-MAAP-INI-003', NOW() - INTERVAL  '5 months  9 days',  3.6312, -68.1503, -9.1, 318, 4, 1, 'verificar',        'Resguardo Caranacoa', 'Curripaco', false, 950),
  ('DEMO-MAAP-INI-004', NOW() - INTERVAL  '3 months  2 days',  3.9001, -67.7820, -7.9, 530, 7, 2, 'ilegal_presunto', NULL, NULL, false, 1240),
  ('DEMO-MAAP-INI-005', NOW() - INTERVAL    '41 days',          3.7012, -68.0708, -8.3, 412, 5, 2, 'ilegal_presunto', 'Resguardo Caranacoa', 'Curripaco', false, 950),
  ('DEMO-MAAP-INI-006', NOW() - INTERVAL     '9 days',          3.8225, -67.9905, -7.7, 487, 6, 3, 'ilegal_presunto', NULL, NULL, false, 1240),

  -- ── Río Atrato (Chocó) — sentencia T-622/16 ──────────────────────
  ('DEMO-MAAP-ATR-001', NOW() - INTERVAL '12 months  4 days',  6.5821, -76.8240, -8.0, 612, 8, 3, 'ilegal_presunto', NULL, 'Comunidades Atrato (T-622/16)', true, 4200),
  ('DEMO-MAAP-ATR-002', NOW() - INTERVAL  '9 months 17 days',  6.7102, -76.9810, -7.2, 745, 9, 3, 'ilegal_presunto', NULL, 'Comunidades Atrato (T-622/16)', true, 4200),
  ('DEMO-MAAP-ATR-003', NOW() - INTERVAL  '7 months  6 days',  6.4910, -76.7505, -8.6, 428, 6, 2, 'ilegal_presunto', NULL, 'Comunidades Atrato (T-622/16)', true, 4200),
  ('DEMO-MAAP-ATR-004', NOW() - INTERVAL  '4 months 13 days',  6.8045, -77.0211, -7.5, 690, 9, 3, 'ilegal_presunto', NULL, 'Comunidades Atrato (T-622/16)', true, 4200),
  ('DEMO-MAAP-ATR-005', NOW() - INTERVAL  '1 month   24 days', 6.5402, -76.8011, -8.1, 380, 5, 2, 'ilegal_presunto', NULL, 'Comunidades Atrato (T-622/16)', true, 4200),
  ('DEMO-MAAP-ATR-006', NOW() - INTERVAL    '12 days',          6.6210, -76.8718, -7.8, 552, 7, 2, 'verificar',        NULL, 'Comunidades Atrato (T-622/16)', true, 4200),

  -- ── Río Cotuhé / Putumayo (zona triple frontera) ────────────────
  ('DEMO-MAAP-COT-001', NOW() - INTERVAL '10 months  9 days', -2.5210, -70.0145, -9.0, 295, 4, 1, 'verificar',        'Resguardo Cotuhé', 'Ticuna', false, 720),
  ('DEMO-MAAP-COT-002', NOW() - INTERVAL  '6 months  4 days', -2.6131, -70.1102, -7.8, 488, 6, 2, 'ilegal_presunto', 'Resguardo Cotuhé', 'Ticuna', false, 720),
  ('DEMO-MAAP-COT-003', NOW() - INTERVAL  '3 months 26 days', -2.5402, -70.0512, -8.3, 360, 5, 2, 'verificar',        'Resguardo Cotuhé', 'Ticuna', false, 720),
  ('DEMO-MAAP-COT-004', NOW() - INTERVAL    '31 days',         -2.5905, -70.0823, -7.5, 612, 8, 3, 'ilegal_presunto', 'Resguardo Cotuhé', 'Ticuna', false, 720)
) AS s(
  scene_id, scene_date_utc,
  lat, lon,
  backscatter, area_m2, pixels,
  confidence, legal,
  indigenous, nation, ddhh,
  pop_exposed
);

-- Verificación rápida
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM alerts WHERE scene_id LIKE 'DEMO-MAAP-%';
  RAISE NOTICE 'Alertas DEMO sembradas: %', n;
END $$;
