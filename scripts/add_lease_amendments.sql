CREATE TYPE amendment_type AS ENUM (
  'rent_adjustment', 'term_extension', 'responsibility_change', 'tenant_change', 'owner_change', 'other'
);

CREATE TYPE amendment_status AS ENUM ('draft', 'pending_signature', 'signed', 'cancelled');

CREATE TABLE amendment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type amendment_type NOT NULL,
  name TEXT NOT NULL,
  content_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE lease_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_contract_id UUID NOT NULL REFERENCES lease_contracts(id) ON DELETE RESTRICT,
  template_id UUID REFERENCES amendment_templates(id) ON DELETE SET NULL,
  type amendment_type NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  changes JSONB NOT NULL DEFAULT '{}',
  status amendment_status NOT NULL DEFAULT 'draft',
  effective_date DATE,
  agency_signature_name TEXT,
  agency_signed_at TIMESTAMP,
  owner_signature_name TEXT,
  owner_signed_at TIMESTAMP,
  tenant_signature_name TEXT,
  tenant_signed_at TIMESTAMP,
  applied_at TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_lease_amendments_lease ON lease_amendments(lease_contract_id);
CREATE INDEX idx_lease_amendments_status ON lease_amendments(status);

INSERT INTO amendment_templates (type, name, content_template) VALUES
(
  'rent_adjustment',
  'Aditivo de Reajuste de Aluguel',
  'ADITIVO CONTRATUAL DE REAJUSTE DE ALUGUEL

Contrato de locação referente ao imóvel {{property_title}} ({{property_code}}), celebrado entre {{owner_name}} (locador) e {{tenant_name}} (locatário).

As partes acordam o reajuste do valor do aluguel mensal de {{rent_value_from}} para {{rent_value_to}}, com vigência a partir de {{effective_date}}.

Permanecem inalteradas as demais cláusulas do contrato original.'
),
(
  'term_extension',
  'Aditivo de Prorrogação de Prazo',
  'ADITIVO CONTRATUAL DE PRORROGAÇÃO DE PRAZO

Contrato de locação referente ao imóvel {{property_title}} ({{property_code}}), celebrado entre {{owner_name}} (locador) e {{tenant_name}} (locatário).

As partes acordam a prorrogação do prazo contratual, alterando a data de término de {{end_date_from}} para {{end_date_to}}.

Permanecem inalteradas as demais cláusulas do contrato original.'
),
(
  'responsibility_change',
  'Aditivo de Alteração de Responsabilidades',
  'ADITIVO CONTRATUAL DE ALTERAÇÃO DE RESPONSABILIDADES

Contrato de locação referente ao imóvel {{property_title}} ({{property_code}}), celebrado entre {{owner_name}} (locador) e {{tenant_name}} (locatário).

As partes acordam a alteração das responsabilidades contratuais conforme detalhado abaixo, com vigência a partir de {{effective_date}}.

Permanecem inalteradas as demais cláusulas do contrato original.'
),
(
  'tenant_change',
  'Aditivo de Substituição de Inquilino',
  'ADITIVO CONTRATUAL DE SUBSTITUIÇÃO DE LOCATÁRIO

Contrato de locação referente ao imóvel {{property_title}} ({{property_code}}), celebrado com {{owner_name}} (locador).

As partes acordam a substituição do locatário de {{tenant_name_from}} para {{tenant_name_to}}, com vigência a partir de {{effective_date}}, mantendo-se as demais condições do contrato original.'
),
(
  'other',
  'Aditivo Genérico',
  'ADITIVO CONTRATUAL

Contrato de locação referente ao imóvel {{property_title}} ({{property_code}}), celebrado entre {{owner_name}} (locador) e {{tenant_name}} (locatário).

As partes acordam as alterações descritas neste aditivo, com vigência a partir de {{effective_date}}.

Permanecem inalteradas as demais cláusulas do contrato original.'
);
