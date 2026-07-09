-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'realtor', 'client', 'visitor');
CREATE TYPE property_type AS ENUM ('house', 'apartment', 'land', 'commercial', 'garage', 'farm', 'other');
CREATE TYPE property_purpose AS ENUM ('sale', 'rent', 'temporary');
CREATE TYPE property_status AS ENUM ('available', 'reserved', 'sold', 'rented', 'archived');
CREATE TYPE lead_source AS ENUM ('website', 'whatsapp', 'phone', 'instagram', 'facebook', 'email', 'referral', 'other');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'visit_scheduled', 'proposal_sent', 'negotiating', 'sold', 'lost', 'no_response');
CREATE TYPE interaction_type AS ENUM ('call', 'message', 'email', 'visit', 'proposal', 'note');
CREATE TYPE sale_status AS ENUM ('completed', 'pending', 'cancelled');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
CREATE TYPE realtor_permission AS ENUM ('manage_own_properties', 'manage_all_properties', 'manage_leads', 'manage_sales', 'view_reports', 'manage_team', 'manage_settings');
CREATE TYPE realtor_status AS ENUM ('active', 'inactive');

-- Users table (base for all user types)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'visitor',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Realtors table (extends users)
CREATE TABLE IF NOT EXISTS realtors (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  creci VARCHAR(50),
  commission_rate DECIMAL(5, 2) DEFAULT 5.00,
  bio TEXT,
  total_sales INTEGER DEFAULT 0,
  total_earnings DECIMAL(15, 2) DEFAULT 0.00,
  status realtor_status DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Realtor permissions (junction table for granular permissions)
CREATE TABLE IF NOT EXISTS realtor_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  permission realtor_permission NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(realtor_id, permission)
);

-- Clients table (extends users)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  document_number VARCHAR(20),
  preferred_property_types TEXT[], -- Array of property types
  price_range_min DECIMAL(15, 2),
  price_range_max DECIMAL(15, 2),
  preferred_cities TEXT[], -- Array of cities
  preferred_neighborhoods TEXT[], -- Array of neighborhoods
  preferred_bedrooms INTEGER,
  purpose property_purpose,
  needs_financing BOOLEAN DEFAULT FALSE,
  preferences_notes TEXT,
  favorite_count INTEGER DEFAULT 0,
  lead_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type property_type NOT NULL,
  purpose property_purpose NOT NULL,
  value DECIMAL(15, 2) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  total_area DECIMAL(10, 2) NOT NULL,
  built_area DECIMAL(10, 2) NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  parking_spaces INTEGER DEFAULT 0,
  description TEXT,
  amenities TEXT[], -- Array of amenities
  status property_status DEFAULT 'available',
  condominium_fee DECIMAL(10, 2),
  iptu DECIMAL(10, 2),
  owner_name VARCHAR(255),
  owner_contact VARCHAR(255),
  commission_rate DECIMAL(5, 2),
  commission_value DECIMAL(15, 2),
  is_opportunity BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_exclusive BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP,

  CONSTRAINT valid_areas CHECK (built_area <= total_area),
  CONSTRAINT valid_value CHECK (value > 0)
);

-- Property images
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_main BOOLEAN DEFAULT FALSE,
  "order" INTEGER,
  created_at TIMESTAMP DEFAULT now(),

  UNIQUE(property_id, image_url)
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  realtor_id UUID REFERENCES realtors(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  source lead_source NOT NULL DEFAULT 'website',
  status lead_status DEFAULT 'new',
  internal_notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Lead interactions (call logs, visits, emails, etc)
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type interaction_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  proposed_value DECIMAL(15, 2),
  status proposal_status DEFAULT 'draft',
  message TEXT,
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Favorites (saved properties for clients)
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),

  UNIQUE(client_id, property_id)
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  sale_value DECIMAL(15, 2) NOT NULL,
  commission_percentage DECIMAL(5, 2),
  commission_value DECIMAL(15, 2),
  costs DECIMAL(15, 2) DEFAULT 0.00,
  advertising_costs DECIMAL(15, 2) DEFAULT 0.00,
  operational_costs DECIMAL(15, 2) DEFAULT 0.00,
  taxes DECIMAL(15, 2) DEFAULT 0.00,
  realtor_payment DECIMAL(15, 2),
  gross_profit DECIMAL(15, 2),
  net_profit DECIMAL(15, 2),
  status sale_status DEFAULT 'completed',
  notes TEXT,
  sale_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT valid_sale_value CHECK (sale_value > 0)
);

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) NOT NULL,
  company_logo_url TEXT,
  company_phone VARCHAR(20),
  company_email VARCHAR(255),
  company_address TEXT,
  company_city VARCHAR(100),
  whatsapp_number VARCHAR(20),
  max_opportunities_carousel INTEGER DEFAULT 5,
  default_commission_rate DECIMAL(5, 2) DEFAULT 5.00,
  social_instagram VARCHAR(255),
  social_facebook VARCHAR(255),
  social_linkedin VARCHAR(255),
  updated_at TIMESTAMP DEFAULT now(),

  UNIQUE(id) -- Only one row allowed
);

-- Create indexes for better query performance
CREATE INDEX idx_properties_realtor ON properties(realtor_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_is_opportunity ON properties(is_opportunity) WHERE is_opportunity = TRUE;
CREATE INDEX idx_properties_created ON properties(created_at DESC);
CREATE INDEX idx_leads_property ON leads(property_id);
CREATE INDEX idx_leads_realtor ON leads(realtor_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_sales_realtor ON sales(realtor_id);
CREATE INDEX idx_sales_property ON sales(property_id);
CREATE INDEX idx_sales_date ON sales(sale_date DESC);
CREATE INDEX idx_favorites_client ON favorites(client_id);
CREATE INDEX idx_property_images_property ON property_images(property_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies will be created in separate file for clarity
