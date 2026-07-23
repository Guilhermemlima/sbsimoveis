CREATE TYPE maintenance_category AS ENUM (
  'plumbing', 'electrical', 'structural', 'appliance', 'hvac', 'pest_control', 'painting', 'locksmith', 'other'
);

CREATE TYPE maintenance_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TYPE maintenance_status AS ENUM (
  'requested', 'under_review', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE maintenance_responsibility AS ENUM (
  'pending_definition', 'owner', 'tenant', 'agency', 'insurance', 'shared'
);

CREATE TYPE maintenance_financial_action AS ENUM (
  'none', 'owner_deduction', 'tenant_charge', 'agency_expense', 'insurance_claim', 'shared'
);

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  lease_contract_id UUID REFERENCES lease_contracts(id) ON DELETE SET NULL,
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES property_owners(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category maintenance_category NOT NULL DEFAULT 'other',
  priority maintenance_priority NOT NULL DEFAULT 'normal',
  status maintenance_status NOT NULL DEFAULT 'requested',
  responsibility maintenance_responsibility NOT NULL DEFAULT 'pending_definition',
  responsibility_notes TEXT,
  owner_share_percentage DECIMAL(5, 2) NOT NULL DEFAULT 50,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  estimated_cost DECIMAL(15, 2),
  actual_cost DECIMAL(15, 2),
  financial_action maintenance_financial_action NOT NULL DEFAULT 'none',
  financial_applied BOOLEAN NOT NULL DEFAULT false,
  financial_applied_at TIMESTAMP,
  completed_at TIMESTAMP,
  completed_by TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_maintenance_requests_property ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);

CREATE TABLE maintenance_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'photo',
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE maintenance_owner_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  amount DECIMAL(15, 2) NOT NULL,
  applied BOOLEAN NOT NULL DEFAULT false,
  owner_payout_id UUID REFERENCES owner_payouts(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_maintenance_owner_deductions_pending ON maintenance_owner_deductions(property_id) WHERE applied = false;
