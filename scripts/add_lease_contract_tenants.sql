-- Etapa 3.2 do roadmap: permite mais de um inquilino por contrato de locação,
-- cada um com sua participação, além de RG (CPF já existia como document_number).
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS rg VARCHAR(20);

CREATE TABLE IF NOT EXISTS lease_contract_tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_contract_id UUID NOT NULL REFERENCES lease_contracts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  participation_percentage DECIMAL(5, 2) NOT NULL DEFAULT 100 CHECK (participation_percentage > 0 AND participation_percentage <= 100),
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT unique_lease_contract_tenant UNIQUE (lease_contract_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_lease_contract_tenants_lease ON lease_contract_tenants(lease_contract_id);
CREATE INDEX IF NOT EXISTS idx_lease_contract_tenants_tenant ON lease_contract_tenants(tenant_id);

-- Preenche a tabela nova com o inquilino único já existente em cada contrato (100%).
INSERT INTO lease_contract_tenants (lease_contract_id, tenant_id, participation_percentage)
SELECT id, tenant_id, 100
FROM lease_contracts
ON CONFLICT (lease_contract_id, tenant_id) DO NOTHING;
