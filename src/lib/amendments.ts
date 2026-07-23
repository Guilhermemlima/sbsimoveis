import { formatDateBR } from '@/lib/format';

export const AMENDMENT_FIELD_LABEL: Record<string, string> = {
  rent_value: 'Valor do aluguel',
  end_date: 'Data de término',
  admin_fee_percentage: 'Taxa de administração (%)',
  due_day: 'Dia de vencimento',
  deposit_value: 'Valor da caução',
  tenant_id: 'Inquilino',
  owner_id: 'Proprietário',
  water_responsible: 'Responsável pela água',
  energy_responsible: 'Responsável pela energia',
  iptu_responsible: 'Responsável pelo IPTU',
  insurance_responsible: 'Responsável pelo seguro',
  condo_responsible: 'Responsável pelo condomínio',
};

export function formatAmendmentValue(key: string, value: unknown, names: Map<string, string>): string {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'tenant_id' || key === 'owner_id') return names.get(String(value)) ?? String(value);
  if (key === 'end_date') return formatDateBR(String(value));
  if (key === 'rent_value' || key === 'deposit_value') return `R$ ${Number(value).toFixed(2)}`;
  if (key === 'admin_fee_percentage') return `${Number(value)}%`;
  return String(value);
}

export function renderAmendmentTemplate(template: string, context: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => context[key] ?? match);
}
