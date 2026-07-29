// User Types
export type UserRole =
  | 'admin'
  | 'realtor'
  | 'client'
  | 'visitor'
  | 'tenant'
  | 'finance'
  | 'inspector'
  | 'maintenance_staff';

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
  contacts_count?: number;
  shares_count?: number;
  video_url?: string | null;
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

export type OwnerPaymentMethod = 'pix' | 'ted' | 'doc' | 'dinheiro' | 'boleto';

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
  payment_method?: OwnerPaymentMethod | null;
  payment_beneficiary_name?: string | null;
  preferred_payment_day?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Guarantor {
  id: string;
  name: string;
  document_number?: string | null;
  rg?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuarantorDocument {
  id: string;
  guarantor_id: string;
  name: string;
  file_path: string;
  file_type: string | null;
  uploaded_by?: string | null;
  created_at: string;
}

export interface Tenant {
  id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  document_number?: string | null;
  rg?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaseContractTenant {
  id: string;
  lease_contract_id: string;
  tenant_id: string;
  participation_percentage: number;
  created_at: string;
}

export type FirstRentRetentionType =
  | 'none'
  | 'fifty_percent'
  | 'hundred_percent'
  | 'custom_percentage'
  | 'custom_amount';

export type RetentionBasis = 'gross' | 'net';

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
  deposit_months?: number | null;
  deposit_status: DepositStatus;
  deposit_received_date?: string | null;
  deposit_returned_date?: string | null;
  deposit_returned_amount?: number | null;
  fiance_insurance_company?: string | null;
  fiance_insurance_policy_number?: string | null;
  fiance_insurance_value?: number | null;
  fiance_insurance_start_date?: string | null;
  fiance_insurance_end_date?: string | null;
  fiance_insurance_file_path?: string | null;
  fiance_insurance_file_name?: string | null;
  first_rent_retention_type: FirstRentRetentionType;
  first_rent_retention_percentage?: number | null;
  first_rent_retention_fixed_amount?: number | null;
  first_rent_retention_basis: RetentionBasis;
  first_rent_retention_include_extra_fees: boolean;
  first_rent_retention_installments: number;
  first_rent_retention_installments_applied: number;
  first_rent_retention_total_amount?: number | null;
  first_rent_retention_notes?: string | null;
  first_rent_retention_configured_by?: string | null;
  first_rent_retention_applied_at?: string | null;
  status: ContractStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaseContractOwner {
  id: string;
  lease_contract_id: string;
  owner_id: string;
  percentage: number;
  commission_rate: number;
  created_at: string;
}

export type DepositStatus = 'held' | 'partially_refunded' | 'refunded' | 'forfeited';

export interface DepositDeduction {
  id: string;
  lease_contract_id: string;
  description: string;
  amount: number;
  created_by?: string | null;
  created_at: string;
}

export interface OwnerPayout {
  id: string;
  owner_id: string;
  property_id: string;
  lease_contract_id: string;
  rent_charge_id?: string | null;
  competence_date: string;
  rent_amount: number;
  admin_fee_amount: number;
  deductions_amount: number;
  first_rent_retention_amount: number;
  net_amount: number;
  status: TransactionStatus;
  paid_date?: string | null;
  payment_method?: string | null;
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

// Inspections (Vistorias)
export type InspectionType = 'entry' | 'exit' | 'periodic' | 'emergency' | 'maintenance' | 'custom';

export type InspectionStatus =
  | 'pending'
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'awaiting_signature'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'with_pending_issues';

export type InspectionItemRating =
  | 'new'
  | 'excellent'
  | 'good'
  | 'regular'
  | 'bad'
  | 'damaged'
  | 'not_applicable';

export interface Inspection {
  id: string;
  property_id: string;
  lease_contract_id?: string | null;
  owner_id?: string | null;
  tenant_id?: string | null;
  type: InspectionType;
  custom_type_label?: string | null;
  status: InspectionStatus;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  performed_date?: string | null;
  performed_by?: string | null;
  notes?: string | null;
  final_report?: string | null;
  inspector_signature_name?: string | null;
  inspector_signed_at?: string | null;
  tenant_signature_name?: string | null;
  tenant_signed_at?: string | null;
  owner_signature_name?: string | null;
  owner_signed_at?: string | null;
  is_locked: boolean;
  version: number;
  superseded_by?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionEnvironment {
  id: string;
  inspection_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface InspectionItem {
  id: string;
  environment_id: string;
  item_type: string;
  rating: InspectionItemRating;
  comments?: string | null;
  pre_existing_damage: boolean;
  damage_during_lease: boolean;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionMedia {
  id: string;
  inspection_id: string;
  environment_id?: string | null;
  item_id?: string | null;
  file_path: string;
  file_type: string;
  uploaded_by?: string | null;
  created_at: string;
}

// Maintenance (Manutenção)
export type MaintenanceCategory =
  | 'plumbing'
  | 'electrical'
  | 'structural'
  | 'appliance'
  | 'hvac'
  | 'pest_control'
  | 'painting'
  | 'locksmith'
  | 'other';

export type MaintenancePriority = 'low' | 'normal' | 'high' | 'urgent';

export type MaintenanceStatus =
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type MaintenanceResponsibility = 'pending_definition' | 'owner' | 'tenant' | 'agency' | 'insurance' | 'shared';

export type MaintenanceFinancialAction =
  | 'none'
  | 'owner_deduction'
  | 'tenant_charge'
  | 'agency_expense'
  | 'insurance_claim'
  | 'shared';

export interface MaintenanceRequest {
  id: string;
  property_id: string;
  lease_contract_id?: string | null;
  inspection_id?: string | null;
  owner_id?: string | null;
  tenant_id?: string | null;
  title: string;
  description?: string | null;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  responsibility: MaintenanceResponsibility;
  responsibility_notes?: string | null;
  owner_share_percentage: number;
  requested_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  financial_action: MaintenanceFinancialAction;
  financial_applied: boolean;
  financial_applied_at?: string | null;
  completed_at?: string | null;
  completed_by?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceMedia {
  id: string;
  maintenance_request_id: string;
  file_path: string;
  file_type: string;
  uploaded_by?: string | null;
  created_at: string;
}

// Lease Amendments (Aditivos)
export type AmendmentType =
  | 'rent_adjustment'
  | 'term_extension'
  | 'responsibility_change'
  | 'tenant_change'
  | 'owner_change'
  | 'other';

export type AmendmentStatus = 'draft' | 'pending_signature' | 'signed' | 'cancelled';

export interface AmendmentChange {
  from: unknown;
  to: unknown;
}

export interface AmendmentTemplate {
  id: string;
  type: AmendmentType;
  name: string;
  content_template: string;
  is_active: boolean;
  created_at: string;
}

export interface LeaseAmendment {
  id: string;
  lease_contract_id: string;
  template_id?: string | null;
  type: AmendmentType;
  version: number;
  title: string;
  content: string;
  changes: Record<string, AmendmentChange>;
  status: AmendmentStatus;
  effective_date?: string | null;
  agency_signature_name?: string | null;
  agency_signed_at?: string | null;
  owner_signature_name?: string | null;
  owner_signed_at?: string | null;
  tenant_signature_name?: string | null;
  tenant_signed_at?: string | null;
  applied_at?: string | null;
  created_by?: string | null;
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
