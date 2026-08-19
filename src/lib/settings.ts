import { createServiceRoleClient } from '@/lib/supabase';

export interface AppSettings {
  id: string;
  company_name: string;
  company_logo_url: string | null;
  company_phone: string;
  company_email: string;
  company_address: string;
  company_city: string;
  whatsapp_number: string;
  max_opportunities_carousel: number;
  default_commission_rate: number;
  rental_profit_expense_rate: number;
  social_instagram: string | null;
  social_facebook: string | null;
  social_linkedin: string | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: '',
  company_name: 'SBS Imóveis',
  company_logo_url: null,
  company_phone: '(42) 98444-7987',
  company_email: 'diretoriasbsimoveis@gmail.com',
  company_address: 'Guarapuava, PR',
  company_city: 'Guarapuava',
  whatsapp_number: '5542984447987',
  max_opportunities_carousel: 5,
  default_commission_rate: 5,
  rental_profit_expense_rate: 0,
  social_instagram: 'https://www.instagram.com/sbsimobiliaria/',
  social_facebook: 'https://www.facebook.com/profile.php?id=61591639603178',
  social_linkedin: null,
};

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from('app_settings').select('*').limit(1).maybeSingle();
  return data ?? DEFAULT_SETTINGS;
}
