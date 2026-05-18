-- Campos visibles (no PII) para el panel admin de destinatarios.
-- phone_last4: últimos 4 dígitos (no identifican por sí solos)
-- role: nombre o rol opcional ("Guardia OPIAC", "Coordinador CAR", ...)

ALTER TABLE recipients ADD COLUMN IF NOT EXISTS phone_last4 TEXT;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS role TEXT;

CREATE INDEX IF NOT EXISTS idx_recipients_active ON recipients(active);
