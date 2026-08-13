-- =====================================================================
-- CRM: funil de captacao (venda ou locacao) com anexos por etapa
-- =====================================================================
-- Fluxo: Assinatura da Opcao -> Fotos do Imovel -> Divulgacao ->
--        Comprador/Locador -> Vistoria -> Contrato Assinado
-- Em cada etapa e possivel anexar arquivos, que ficam salvos no banco
-- e no bucket "property-documents", sob o prefixo crm-deal-{id}/.
-- =====================================================================

CREATE TYPE crm_deal_type AS ENUM ('venda', 'locacao');

CREATE TYPE crm_deal_stage AS ENUM (
  'assinatura_opcao',
  'fotos_imovel',
  'divulgacao',
  'comprador_locador',
  'vistoria',
  'contrato_assinado',
  'perdido'
);

CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_type crm_deal_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  stage crm_deal_stage NOT NULL DEFAULT 'assinatura_opcao',

  -- Imovel: pode ser um ja cadastrado, ou so o endereco enquanto a
  -- captacao ainda nao virou anuncio.
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_address TEXT,

  -- Quem esta oferecendo o imovel (proprietario da captacao)
  owner_name VARCHAR(255),
  owner_phone VARCHAR(20),
  owner_email VARCHAR(255),

  -- Quem vai comprar/alugar (preenchido a partir da etapa Comprador/Locador)
  client_name VARCHAR(255),
  client_phone VARCHAR(20),
  client_email VARCHAR(255),

  deal_value NUMERIC(15, 2),
  realtor_id UUID REFERENCES realtors(id) ON DELETE SET NULL,
  notes TEXT,
  closed_at TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_type ON crm_deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_crm_deals_property ON crm_deals(property_id);

-- Anexos por etapa (opcao assinada, fotos, prints da divulgacao,
-- fotos da vistoria, contrato assinado etc).
CREATE TABLE IF NOT EXISTS crm_deal_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  stage crm_deal_stage NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deal_files_deal ON crm_deal_files(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_deal_files_stage ON crm_deal_files(deal_id, stage);

-- Historico de movimentacao entre etapas.
CREATE TABLE IF NOT EXISTS crm_deal_stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  from_stage crm_deal_stage,
  to_stage crm_deal_stage NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deal_stage_history_deal ON crm_deal_stage_history(deal_id);
