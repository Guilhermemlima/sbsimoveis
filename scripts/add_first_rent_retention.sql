-- Novos módulos (parte 1): retenção do primeiro aluguel — configuração
-- por contrato de quanto a imobiliária retém do primeiro pagamento do
-- inquilino, com cálculo automático e aplicação idempotente (uma única
-- vez por contrato, ou dividida em N meses). Não remove nem altera nada
-- do que já existe.

CREATE TYPE first_rent_retention_type AS ENUM (
  'none',
  'fifty_percent',
  'hundred_percent',
  'custom_percentage',
  'custom_amount'
);

CREATE TYPE retention_basis AS ENUM ('gross', 'net');

ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS first_rent_retention_type first_rent_retention_type NOT NULL DEFAULT 'none';
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS first_rent_retention_percentage DECIMAL(5, 2);
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS first_rent_retention_fixed_amount DECIMAL(15, 2);
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS first_rent_retention_basis retention_basis NOT NULL DEFAULT 'gross';
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS first_rent_retention_include_extra_fees BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS first_rent_retention_installments INTEGER NOT NULL DEFAULT 1;
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS first_rent_retention_installments_applied INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS first_rent_retention_total_amount DECIMAL(15, 2);
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS first_rent_retention_notes TEXT;
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS first_rent_retention_configured_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS first_rent_retention_applied_at TIMESTAMP;

ALTER TABLE owner_payouts ADD COLUMN IF NOT EXISTS first_rent_retention_amount DECIMAL(15, 2) NOT NULL DEFAULT 0;
