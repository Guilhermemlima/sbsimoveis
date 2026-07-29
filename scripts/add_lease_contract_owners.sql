-- Etapa 3.1 do roadmap: permite mais de um proprietário por contrato de locação,
-- cada um com seu percentual de participação e comissão específica.
CREATE TABLE IF NOT EXISTS lease_contract_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_contract_id UUID NOT NULL REFERENCES lease_contracts(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES property_owners(id) ON DELETE RESTRICT,
  percentage DECIMAL(5, 2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT unique_lease_contract_owner UNIQUE (lease_contract_id, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_lease_contract_owners_lease ON lease_contract_owners(lease_contract_id);
CREATE INDEX IF NOT EXISTS idx_lease_contract_owners_owner ON lease_contract_owners(owner_id);

-- Preenche a tabela nova com o proprietário único já existente em cada contrato (100%).
INSERT INTO lease_contract_owners (lease_contract_id, owner_id, percentage)
SELECT id, owner_id, 100
FROM lease_contracts
ON CONFLICT (lease_contract_id, owner_id) DO NOTHING;

-- owner_payouts precisa permitir mais de um repasse por cobrança (um por proprietário).
ALTER TABLE owner_payouts DROP CONSTRAINT IF EXISTS unique_payout_per_charge;
ALTER TABLE owner_payouts ADD CONSTRAINT unique_payout_per_charge_owner UNIQUE (rent_charge_id, owner_id);
ALTER TABLE owner_payouts ADD COLUMN IF NOT EXISTS ownership_percentage DECIMAL(5, 2);
