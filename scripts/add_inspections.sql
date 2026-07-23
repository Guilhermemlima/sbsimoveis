-- Novos módulos (parte 2): módulo de vistorias — vistoria de entrada,
-- saída, periódica, emergencial, de manutenção ou personalizada, com
-- checklist por ambiente, fotos, comparação entre vistorias e laudo
-- final com registro interno de assinatura. Não remove nem altera nada
-- do que já existe.

CREATE TYPE inspection_type AS ENUM (
  'entry',
  'exit',
  'periodic',
  'emergency',
  'maintenance',
  'custom'
);

CREATE TYPE inspection_status AS ENUM (
  'pending',
  'scheduled',
  'confirmed',
  'in_progress',
  'awaiting_signature',
  'completed',
  'cancelled',
  'rescheduled',
  'with_pending_issues'
);

CREATE TYPE inspection_item_rating AS ENUM (
  'new',
  'excellent',
  'good',
  'regular',
  'bad',
  'damaged',
  'not_applicable'
);

CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  lease_contract_id UUID REFERENCES lease_contracts(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES property_owners(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  type inspection_type NOT NULL,
  custom_type_label VARCHAR(100),
  status inspection_status NOT NULL DEFAULT 'pending',
  scheduled_date DATE,
  scheduled_time TIME,
  performed_date DATE,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  final_report TEXT,
  inspector_signature_name VARCHAR(255),
  inspector_signed_at TIMESTAMP,
  tenant_signature_name VARCHAR(255),
  tenant_signed_at TIMESTAMP,
  owner_signature_name VARCHAR(255),
  owner_signed_at TIMESTAMP,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  superseded_by UUID REFERENCES inspections(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspections_property ON inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_lease ON inspections(lease_contract_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_type ON inspections(type);

CREATE TABLE IF NOT EXISTS inspection_environments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspection_environments_inspection ON inspection_environments(inspection_id);

CREATE TABLE IF NOT EXISTS inspection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  environment_id UUID NOT NULL REFERENCES inspection_environments(id) ON DELETE CASCADE,
  item_type VARCHAR(60) NOT NULL,
  rating inspection_item_rating NOT NULL DEFAULT 'not_applicable',
  comments TEXT,
  pre_existing_damage BOOLEAN NOT NULL DEFAULT false,
  damage_during_lease BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspection_items_environment ON inspection_items(environment_id);

CREATE TABLE IF NOT EXISTS inspection_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  environment_id UUID REFERENCES inspection_environments(id) ON DELETE SET NULL,
  item_id UUID REFERENCES inspection_items(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(20) NOT NULL DEFAULT 'photo',
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspection_media_inspection ON inspection_media(inspection_id);
