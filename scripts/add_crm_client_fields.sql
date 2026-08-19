-- =====================================================================
-- CRM: mais dados do proprietario e do cliente na captacao
-- =====================================================================
-- Campos usados para criar o cadastro real automaticamente quando a
-- captacao e salva.
-- =====================================================================

-- Proprietario
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS owner_document VARCHAR(20);
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS owner_rg VARCHAR(20);
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS owner_address TEXT;

-- Cliente (comprador ou locatario, conforme o tipo da captacao)
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS client_document VARCHAR(20);
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS client_rg VARCHAR(20);
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS client_address TEXT;
