-- Fase 1: fundação do módulo de locação (proprietários, inquilinos,
-- contratos de locação, centros financeiros e categorias financeiras).
-- Não remove nem altera nada do que já existe.

CREATE TYPE financial_center AS ENUM (
  'sales',
  'rental',
  'administrative',
  'maintenance',
  'owner_payouts'
);

CREATE TYPE financial_type AS ENUM ('revenue', 'expense');

CREATE TYPE billing_responsible AS ENUM (
  'tenant',
  'owner',
  'agency',
  'split',
  'not_applicable'
);

CREATE TYPE contract_status AS ENUM (
  'draft',
  'active',
  'expiring_soon',
  'expired',
  'terminated',
  'cancelled'
);

-- Proprietários (podem ou não ter login próprio)
CREATE TABLE IF NOT EXISTS property_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  document_number VARCHAR(20),
  bank_name VARCHAR(100),
  bank_agency VARCHAR(20),
  bank_account VARCHAR(30),
  pix_key VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Inquilinos (podem ou não ter login próprio)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  document_number VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Categorias financeiras (receita/despesa por centro financeiro)
CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type financial_type NOT NULL,
  center financial_center NOT NULL,
  parent_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Contratos de locação
CREATE TABLE IF NOT EXISTS lease_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES property_owners(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  realtor_id UUID REFERENCES realtors(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  due_day INTEGER NOT NULL DEFAULT 10 CHECK (due_day BETWEEN 1 AND 31),
  rent_value DECIMAL(15, 2) NOT NULL,
  admin_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10,
  water_responsible billing_responsible NOT NULL DEFAULT 'tenant',
  energy_responsible billing_responsible NOT NULL DEFAULT 'tenant',
  iptu_responsible billing_responsible NOT NULL DEFAULT 'owner',
  insurance_responsible billing_responsible NOT NULL DEFAULT 'tenant',
  condo_responsible billing_responsible NOT NULL DEFAULT 'tenant',
  deposit_value DECIMAL(15, 2) DEFAULT 0,
  status contract_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT valid_lease_dates CHECK (end_date > start_date),
  CONSTRAINT valid_rent_value CHECK (rent_value > 0)
);

CREATE INDEX IF NOT EXISTS idx_lease_contracts_property ON lease_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_lease_contracts_owner ON lease_contracts(owner_id);
CREATE INDEX IF NOT EXISTS idx_lease_contracts_tenant ON lease_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lease_contracts_status ON lease_contracts(status);

-- Lançamentos financeiros (receitas e despesas), já com centro financeiro
-- e categoria — base para as próximas fases (cobranças, repasses, despesas).
CREATE TYPE transaction_status AS ENUM (
  'predicted',
  'pending',
  'awaiting_approval',
  'scheduled',
  'paid',
  'partially_paid',
  'overdue',
  'cancelled',
  'disputed',
  'refunded'
);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type financial_type NOT NULL,
  center financial_center NOT NULL,
  category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  lease_contract_id UUID REFERENCES lease_contracts(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES property_owners(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  competence_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method VARCHAR(50),
  status transaction_status NOT NULL DEFAULT 'pending',
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT valid_transaction_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_center ON financial_transactions(center);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_property ON financial_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_contract ON financial_transactions(lease_contract_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_due_date ON financial_transactions(due_date);
