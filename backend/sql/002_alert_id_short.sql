-- Índice de búsqueda para enlaces WhatsApp (/a/primer_octeto)
-- PostgREST no puede aplicar ILIKE de forma fiable sobre columnas UUID.
-- Esta columna almacena el primer fragmento hex del UUID (8 chars, minúsculas).

ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS id_short TEXT
  GENERATED ALWAYS AS (LOWER(split_part(id::TEXT, '-', 1))) STORED;

CREATE INDEX IF NOT EXISTS idx_alerts_id_short ON alerts(id_short);

