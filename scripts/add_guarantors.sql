-- Etapa 3.3 do roadmap: cadastro completo de fiador, com documentos e vínculo ao contrato.
CREATE TABLE IF NOT EXISTS guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  document_number VARCHAR(20),
  rg VARCHAR(20),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Documentos do fiador (comprovante de renda, RG, etc.) — mesmo bucket já usado
-- para documentos de imóveis e clientes ("property-documents"), sob o prefixo guarantor-{id}/.
CREATE TABLE IF NOT EXISTS guarantor_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guarantor_id UUID NOT NULL REFERENCES guarantors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guarantor_documents_guarantor ON guarantor_documents(guarantor_id);

-- Vínculo opcional de um fiador ao contrato de locação.
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS guarantor_id UUID REFERENCES guarantors(id) ON DELETE SET NULL;
