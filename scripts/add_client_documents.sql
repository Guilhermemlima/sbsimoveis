-- Documents area for clients (IPTU, contrato, matrícula, etc.), separate from property_documents.
-- Files are stored in the existing "property-documents" storage bucket, under a `client-{client_id}/` prefix.
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id);
