-- =====================================================================
-- CRM: vinculo com cadastros existentes + sincronizacao de anexos
-- =====================================================================
-- Permite apontar a captacao para um proprietario, inquilino, fiador e
-- cliente ja cadastrados, e registra para onde cada anexo foi copiado.
-- =====================================================================

-- --- Vinculo com cadastros existentes --------------------------------
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES property_owners(id) ON DELETE SET NULL;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS guarantor_id UUID REFERENCES guarantors(id) ON DELETE SET NULL;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Vistoria criada a partir do CRM (para nao criar uma nova a cada anexo)
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_deals_owner ON crm_deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_tenant ON crm_deals(tenant_id);

-- --- Rastro da sincronizacao de cada anexo ---------------------------
-- synced_to guarda o modulo de destino (ex: property_documents,
-- property_images, owner_documents, inspection_media...) e synced_ref_id
-- o id da linha criada la. synced_error registra o motivo quando nao deu.
ALTER TABLE crm_deal_files ADD COLUMN IF NOT EXISTS synced_to VARCHAR(50);
ALTER TABLE crm_deal_files ADD COLUMN IF NOT EXISTS synced_ref_id UUID;
ALTER TABLE crm_deal_files ADD COLUMN IF NOT EXISTS synced_error TEXT;
ALTER TABLE crm_deal_files ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP;
