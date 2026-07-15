// App Constants and Configuration

export const APP_CONFIG = {
  name: 'SBS Imóveis',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  phone: '(42) 98444-7987',
  email: 'contato@sbsimoveis.com',
  address: 'Guarapuava, PR',
  whatsapp: '5542984447987',
  socialMedia: {
    instagram: 'https://www.instagram.com/sbsimobiliaria/',
    facebook: 'https://www.facebook.com/profile.php?id=61591639603178',
  },
};

export const USER_ROLES = {
  ADMIN: 'admin',
  REALTOR: 'realtor',
  CLIENT: 'client',
  VISITOR: 'visitor',
} as const;

export const PROPERTY_TYPES = {
  HOUSE: 'house',
  APARTMENT: 'apartment',
  LAND: 'land',
  COMMERCIAL: 'commercial',
  GARAGE: 'garage',
  FARM: 'farm',
  OTHER: 'other',
} as const;

export const PROPERTY_TYPE_LABELS = {
  house: '🏠 Casa',
  apartment: '🏢 Apartamento',
  land: '🌳 Terreno',
  commercial: '🏬 Comercial',
  garage: '🚗 Garagem',
  farm: '🌾 Fazenda',
  other: '📦 Outro',
} as const;

export const PROPERTY_PURPOSES = {
  SALE: 'sale',
  RENT: 'rent',
  TEMPORARY: 'temporary',
} as const;

export const PROPERTY_PURPOSE_LABELS = {
  sale: '💰 Venda',
  rent: '🔑 Aluguel',
  temporary: '📅 Temporada',
} as const;

export const PROPERTY_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  SOLD: 'sold',
  RENTED: 'rented',
  ARCHIVED: 'archived',
} as const;

export const PROPERTY_STATUS_LABELS = {
  available: 'Disponível',
  reserved: 'Reservado',
  sold: 'Vendido',
  rented: 'Alugado',
  archived: 'Arquivado',
} as const;

export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  VISIT_SCHEDULED: 'visit_scheduled',
  PROPOSAL_SENT: 'proposal_sent',
  NEGOTIATING: 'negotiating',
  SOLD: 'sold',
  LOST: 'lost',
  NO_RESPONSE: 'no_response',
} as const;

export const LEAD_STATUS_LABELS = {
  new: 'Novo Lead',
  contacted: 'Contatado',
  visit_scheduled: 'Visita Agendada',
  proposal_sent: 'Proposta Enviada',
  negotiating: 'Em Negociação',
  sold: 'Venda Concluída',
  lost: 'Lead Perdido',
  no_response: 'Sem Resposta',
} as const;

export const LEAD_SOURCES = {
  WEBSITE: 'website',
  WHATSAPP: 'whatsapp',
  PHONE: 'phone',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  EMAIL: 'email',
  REFERRAL: 'referral',
  OTHER: 'other',
} as const;

export const LEAD_SOURCE_LABELS = {
  website: '🌐 Website',
  whatsapp: '💬 WhatsApp',
  phone: '📞 Telefone',
  instagram: '📸 Instagram',
  facebook: '👍 Facebook',
  email: '📧 Email',
  referral: '👥 Indicação',
  other: '❓ Outro',
} as const;

export const AMENITIES = [
  { label: 'Piscina', value: 'pool' },
  { label: 'Academia', value: 'gym' },
  { label: 'Churrasqueira', value: 'bbq' },
  { label: 'Quadra de Tênis', value: 'tennis_court' },
  { label: 'Playground', value: 'playground' },
  { label: 'Segurança 24h', value: 'security' },
  { label: 'Garagem Coberta', value: 'covered_garage' },
  { label: 'Ar Condicionado', value: 'ac' },
  { label: 'Eletrônicos de Segurança', value: 'security_system' },
  { label: 'Elevador', value: 'elevator' },
  { label: 'Área Verde', value: 'garden' },
  { label: 'Salão de Festas', value: 'party_room' },
] as const;

export const REALTOR_PERMISSIONS = {
  MANAGE_OWN_PROPERTIES: 'manage_own_properties',
  MANAGE_ALL_PROPERTIES: 'manage_all_properties',
  MANAGE_LEADS: 'manage_leads',
  MANAGE_SALES: 'manage_sales',
  VIEW_REPORTS: 'view_reports',
  MANAGE_TEAM: 'manage_team',
  MANAGE_SETTINGS: 'manage_settings',
} as const;

export const DEFAULT_COMMISSION_RATE = 5.0; // 5%
export const MAX_CAROUSEL_PROPERTIES = 10;
export const MIN_CAROUSEL_PROPERTIES = 3;
export const DEFAULT_CAROUSEL_LIMIT = 5;

// Pagination
export const ITEMS_PER_PAGE = 12;
export const MAX_ITEMS_PER_PAGE = 50;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGES_PER_PROPERTY = 20;

// Form Validation
export const VALIDATION = {
  PHONE_REGEX: /^\([0-9]{2}\)\s?[0-9]{4,5}-[0-9]{4}$/,
  CEP_REGEX: /^\d{5}-?\d{3}$/,
  CRECI_REGEX: /^\d{6}\/[A-Z]{2}$/,
};

// Colors for themes
export const COLORS = {
  primary: '#1e40af', // navy-900
  secondary: '#10b981', // green-600
  success: '#10b981',
  warning: '#f97316',
  error: '#ef4444',
  info: '#3b82f6',
};
