import { createServiceRoleClient } from '@/lib/supabase';

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

interface RecordSaleParams {
  supabase: ServiceClient;
  propertyId: string;
  realtorId: string;
  saleValue: number;
  commissionRate: number;
  purpose: 'sale' | 'rent' | 'temporary';
}

/**
 * Auto-creates a `sales` row from a property being marked sold/rented, so a
 * realtor never has to re-enter the same numbers in a separate Vendas form.
 */
export async function recordSaleForProperty({
  supabase,
  propertyId,
  realtorId,
  saleValue,
  commissionRate,
  purpose,
}: RecordSaleParams) {
  const commissionValue = (saleValue * commissionRate) / 100;

  return supabase.from('sales').insert({
    property_id: propertyId,
    realtor_id: realtorId,
    sale_value: saleValue,
    commission_percentage: commissionRate,
    commission_value: commissionValue,
    costs: 0,
    advertising_costs: 0,
    operational_costs: 0,
    taxes: 0,
    realtor_payment: 0,
    gross_profit: commissionValue,
    net_profit: commissionValue,
    status: 'completed',
    sale_date: new Date().toISOString().slice(0, 10),
    notes: purpose === 'rent' ? 'Registrado automaticamente ao marcar o imóvel como alugado.' : 'Registrado automaticamente ao marcar o imóvel como vendido.',
  });
}
