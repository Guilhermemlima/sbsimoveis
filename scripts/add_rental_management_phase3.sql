-- Fase 3: repasse ao proprietário (com cálculo automático) e módulo de
-- caução (retenção e devolução com vistoria). Não remove nem altera nada
-- do que já existe.

CREATE TYPE deposit_status AS ENUM (
  'held',
  'partially_refunded',
  'refunded',
  'forfeited'
);

ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS deposit_status deposit_status NOT NULL DEFAULT 'held';
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS deposit_received_date DATE;
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS deposit_returned_date DATE;
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS deposit_returned_amount DECIMAL(15, 2);

-- Itens de dedução da caução, lançados na vistoria de saída (danos,
-- pendências de aluguel/contas, limpeza etc.)
CREATE TABLE IF NOT EXISTS deposit_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_contract_id UUID NOT NULL REFERENCES lease_contracts(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT valid_deduction_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_deposit_deductions_lease ON deposit_deductions(lease_contract_id);

-- Repasses ao proprietário: um registro por contrato/mês, calculado
-- automaticamente a partir do aluguel recebido menos a taxa de
-- administração, sem nunca envolver o dinheiro do proprietário em outras
-- operações da imobiliária.
CREATE TABLE IF NOT EXISTS owner_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES property_owners(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  lease_contract_id UUID NOT NULL REFERENCES lease_contracts(id) ON DELETE RESTRICT,
  rent_charge_id UUID REFERENCES financial_transactions(id) ON DELETE SET NULL,
  competence_date DATE NOT NULL,
  rent_amount DECIMAL(15, 2) NOT NULL,
  admin_fee_amount DECIMAL(15, 2) NOT NULL,
  deductions_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(15, 2) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  paid_date DATE,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT valid_payout_amount CHECK (net_amount >= 0),
  CONSTRAINT unique_payout_per_charge UNIQUE (rent_charge_id)
);

CREATE INDEX IF NOT EXISTS idx_owner_payouts_owner ON owner_payouts(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_payouts_property ON owner_payouts(property_id);
CREATE INDEX IF NOT EXISTS idx_owner_payouts_status ON owner_payouts(status);
