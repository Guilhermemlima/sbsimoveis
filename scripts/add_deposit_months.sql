-- Etapa 3.4 do roadmap: campo "quantidade de meses" da caução.
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS deposit_months INTEGER;
