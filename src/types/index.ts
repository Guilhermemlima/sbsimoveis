// User Types
export type UserRole = 'admin' | 'realtor' | 'client' | 'visitor' | 'tenant';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Realtor Types
export interface Realtor extends User {
  creci?: string;
  commission_rate: number;
  bio?: string;
  total_sales: number;
  total_earnings: number;
  status: 'active' | 'inactive';
  permissions: RealtorPermission[];
}

export type RealtorPermission =
  | 'manage_own_properties'
  | 'manage_all_properties'
  | 'manage_leads'
  | 'manage_sales'
  | 'view_reports'
  | 'manage_team'
  | 'manage_settings';

// Client Types
export interface Client extends User {
  document_number?: string;
  preferences?: ClientPreferences;
  favorite_count: number;
  lead_count: number;
}

export interface ClientPreferences {
  property_types: string[];
  price_range: [number, number];
  cities: string[];
  neighborhoods: string[];
  bedrooms?: number;
  purpose: 'buy' | 'rent' | 'both';
  needs_financing: boolean;
  notes?: string;
}

// Property Types
export interface Property {
  id: string;
  realtor_id: string;
  title: string;
  code: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  value: number;
  address: string;
  city: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  total_area: number;
  built_area: number;
  bedrooms: number;
  bathrooms: number;
  parking_spaces: number;
  description: string;
  amenities: string[];
  status: PropertyStatus;
  condominium_fee?: number;
  iptu?: number;
  owner_name?: string;
  owner_contact?: string;
  commission_rate?: number;
  commission_value?: number;
  is_opportunity: boolean;
  is_featured: boolean;
  is_exclusive: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  property_images?: PropertyImage[];
}

export type PropertyType =
  | 'house'
  | 'apartment'
  | 'land'
  | 'commercial'
  | 'garage'
  | 'farm'
  | 'other';

export type PropertyPurpose = 'sale' | 'rent' | 'temporary';

export type PropertyStatus =
  | 'available'
  | 'reserved'
  | 'sold'
  | 'rented'
  | 'archived';

// Property Image
export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  thumbnail_url?: string;
  is_main: boolean;
  order: number;
  created_at: string;
}

// Lead Types
export interface Lead {
  id: string;
  property_id?: string;
  client_id?: string;
  realtor_id?: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  internal_notes: string;
  created_at: string;
  updated_at: string;
}

export type LeadSource =
  | 'website'
  | 'whatsapp'
  | 'phone'
  | 'instagram'
  | 'facebook'
  | 'email'
  | 'referral'
  | 'other';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'visit_scheduled'
  | 'proposal_sent'
  | 'negotiating'
  | 'sold'
  | 'lost'
  | 'no_response';

// Interaction Types
export interface LeadInteraction {
  id: string;
  lead_id: string;
  type: 'call' | 'message' | 'email' | 'visit' | 'proposal' | 'note';
  description: string;
  created_at: string;
  created_by: string;
}

// Sale Types
export interface Sale {
  id: string;
  property_id: string;
  realtor_id: string;
  client_id?: string;
  lead_id?: string;
  sale_value: number;
  commission_percentage: number;
  commission_value: number;
  costs: number;
  advertising_costs: number;
  operational_costs: number;
  taxes: number;
  realtor_payment: number;
  gross_profit: number;
  net_profit: number;
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  sale_date: string;
  created_at: string;
  updated_at: string;
}

// Proposal Types
export interface Proposal {
  id: string;
  lead_id: string;
  property_id: string;
  client_id: string;
  realtor_id: string;
  proposed_value?: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  message?: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

// Favorite Types
export interface Favorite {
  id: string;
  client_id: string;
  property_id: string;
  created_at: string;
}

// Settings Types
export interface AppSettings {
  id: string;
  company_name: string;
  company_logo_url?: string;
  company_phone: string;
  company_email: string;
  company_address: string;
  company_city: string;
  whatsapp_number: string;
  max_opportunities_carousel: number;
  default_commission_rate: number;
  social_instagram?: string;
  social_facebook?: string;
  social_linkedin?: string;
  updated_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  total_properties: number;
  available_properties: number;
  sold_properties: number;
  rented_properties: number;
  total_leads: number;
  converted_leads: number;
  total_sales_value: number;
  total_gross_profit: number;
  total_net_profit: number;
  total_commissions: number;
  conversion_rate: number;
  avg_sale_value: number;
}

// Report Types
export interface SalesReport {
  period: string;
  total_sales: number;
  total_value: number;
  gross_profit: number;
  net_profit: number;
  commissions: number;
  average_value: number;
  by_realtor: RealtorSalesStats[];
  by_city: CitySalesStats[];
  by_property_type: PropertyTypeSalesStats[];
}

export interface RealtorSalesStats {
  realtor_id: string;
  realtor_name: string;
  sales_count: number;
  total_value: number;
  commissions: number;
  net_profit: number;
}

export interface CitySalesStats {
  city: string;
  sales_count: number;
  total_value: number;
}

export interface PropertyTypeSalesStats {
  type: PropertyType;
  sales_count: number;
  total_value: number;
}

// Rental Management (Fase 1)
export type BillingResponsible = 'tenant' | 'owner' | 'agency' | 'split' | 'not_applicable';
export type ContractStatus = 'draft' | 'active' | 'expiring_soon' | 'expired' | 'terminated' | 'cancelled';
export type FinancialCenter = 'sales' | 'rental' | 'administrative' | 'maintenance' | 'owner_payouts';
export type FinancialType = 'revenue' | 'expense';

export interface PropertyOwner {
  id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  document_number?: string | null;
  bank_name?: string | null;
  bank_agency?: string | null;
  bank_account?: string | null;
  pix_key?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  document_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaseContract {
  id: string;
  property_id: string;
  owner_id: string;
  tenant_id: string;
  realtor_id?: string | null;
  start_date: string;
  end_date: string;
  due_day: number;
  rent_value: number;
  admin_fee_percentage: number;
  water_responsible: BillingResponsible;
  energy_responsible: BillingResponsible;
  iptu_responsible: BillingResponsible;
  insurance_responsible: BillingResponsible;
  condo_responsible: BillingResponsible;
  deposit_value: number;
  status: ContractStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type TransactionStatus =
  | 'predicted'
  | 'pending'
  | 'awaiting_approval'
  | 'scheduled'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export interface FinancialTransaction {
  id: string;
  type: FinancialType;
  center: FinancialCenter;
  category_id?: string | null;
  property_id?: string | null;
  lease_contract_id?: string | null;
  owner_id?: string | null;
  tenant_id?: string | null;
  sale_id?: string | null;
  created_by?: string | null;
  description: string;
  amount: number;
  competence_date: string;
  due_date: string;
  paid_date?: string | null;
  payment_method?: string | null;
  status: TransactionStatus;
  receipt_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Filter Types
export interface PropertyFilters {
  search?: string;
  property_type?: PropertyType[];
  purpose?: PropertyPurpose;
  price_min?: number;
  price_max?: number;
  city?: string;
  neighborhood?: string;
  bedrooms?: number;
  status?: PropertyStatus;
  realtor_id?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}
