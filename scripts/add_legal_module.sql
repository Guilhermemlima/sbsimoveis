-- Etapa 6 do roadmap: Módulo Jurídico (contratos, distratos, notificações,
-- cobranças judiciais, despejos e processos), vinculado ao imóvel.

-- Novo papel de usuário "Jurídico", seguindo o mesmo padrão de finance/inspector/maintenance_staff.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'legal';

CREATE TYPE legal_case_type AS ENUM ('contract', 'termination', 'notification', 'collection', 'eviction', 'lawsuit', 'other');
CREATE TYPE legal_case_status AS ENUM ('open', 'in_progress', 'awaiting_response', 'resolved', 'archived');

CREATE TABLE IF NOT EXISTS legal_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  lease_contract_id UUID REFERENCES lease_contracts(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES property_owners(id) ON DELETE SET NULL,
  case_type legal_case_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status legal_case_status NOT NULL DEFAULT 'open',
  process_number VARCHAR(100),
  court VARCHAR(255),
  responsible_id UUID REFERENCES users(id) ON DELETE SET NULL,
  opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline_date DATE,
  closed_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_cases_property ON legal_cases(property_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON legal_cases(status);
CREATE INDEX IF NOT EXISTS idx_legal_cases_type ON legal_cases(case_type);

-- Arquivos do caso (notificações, petições, comprovantes etc) — mesmo bucket
-- já usado para os demais documentos ("property-documents"), sob o prefixo legal-case-{id}/.
CREATE TABLE IF NOT EXISTS legal_case_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legal_case_id UUID NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_case_documents_case ON legal_case_documents(legal_case_id);

-- Histórico de movimentação do status do caso.
CREATE TABLE IF NOT EXISTS legal_case_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legal_case_id UUID NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
  from_status legal_case_status,
  to_status legal_case_status NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_case_status_history_case ON legal_case_status_history(legal_case_id);
