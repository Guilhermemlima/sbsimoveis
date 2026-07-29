-- Documentos de inquilinos e proprietários, mesmo padrão já usado para
-- clientes (client_documents), fiadores (guarantor_documents) e casos
-- jurídicos (legal_case_documents): mesmo bucket "property-documents",
-- diferenciado pelo prefixo do caminho.

CREATE TABLE IF NOT EXISTS tenant_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_documents_tenant ON tenant_documents(tenant_id);

CREATE TABLE IF NOT EXISTS owner_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES property_owners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_documents_owner ON owner_documents(owner_id);

-- Campos que faltavam para o cadastro completo (paridade com o fiador).
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE property_owners ADD COLUMN IF NOT EXISTS rg VARCHAR(20);
ALTER TABLE property_owners ADD COLUMN IF NOT EXISTS address TEXT;
