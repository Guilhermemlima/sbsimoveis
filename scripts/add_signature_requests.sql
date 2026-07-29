-- Etapa 7 do roadmap: assinatura digital terceirizada via Autentique,
-- vinculada ao contrato de locação, com signatários por papel
-- (proprietário, inquilino, fiador, corretor) e histórico de status.

CREATE TABLE IF NOT EXISTS signature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_contract_id UUID NOT NULL REFERENCES lease_contracts(id) ON DELETE CASCADE,
  provider VARCHAR(30) NOT NULL DEFAULT 'autentique',
  provider_document_id VARCHAR(100) NOT NULL,
  document_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, rejected
  signed_file_path TEXT,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signature_requests_lease ON signature_requests(lease_contract_id);

CREATE TABLE IF NOT EXISTS signature_request_signers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signature_request_id UUID NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
  party_role VARCHAR(20) NOT NULL, -- owner, tenant, guarantor, realtor
  party_id UUID,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  provider_signature_id VARCHAR(100),
  sign_url TEXT,
  signed_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signature_request_signers_request ON signature_request_signers(signature_request_id);
