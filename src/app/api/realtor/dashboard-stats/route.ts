import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const scopedToOwn = !canManageAllProperties(user);

  const { data: realtorProfile } = await supabase
    .from('realtors')
    .select('creci, commission_rate, total_sales, total_earnings')
    .eq('id', user.id)
    .maybeSingle();

  let propertiesQuery = supabase
    .from('properties')
    .select('id, status, purpose')
    .is('deleted_at', null);
  if (scopedToOwn) propertiesQuery = propertiesQuery.eq('realtor_id', user.id);

  let salesQuery = supabase
    .from('sales')
    .select('id, sale_value, commission_value, sale_date');
  if (scopedToOwn) salesQuery = salesQuery.eq('realtor_id', user.id);

  let leadsQuery = supabase.from('leads').select('id, status');
  if (scopedToOwn) leadsQuery = leadsQuery.eq('realtor_id', user.id);

  const [propertiesRes, salesRes, leadsRes] = await Promise.all([
    propertiesQuery,
    salesQuery,
    leadsQuery,
  ]);

  const properties = propertiesRes.data ?? [];
  const sales = salesRes.data ?? [];
  const leads = leadsRes.data ?? [];

  const realtorData = {
    name: user.name,
    email: user.email,
    creci: realtorProfile?.creci ?? 'Não informado',
    totalProperties: properties.length,
    availableProperties: properties.filter((p) => p.status === 'available').length,
    soldProperties: properties.filter((p) => p.status === 'sold').length,
    propertiesForRent: properties.filter((p) => p.purpose === 'rent').length,
    activeLeads: leads.filter((l) => !['sold', 'lost', 'no_response'].includes(l.status)).length,
    totalLeads: leads.length,
    convertedLeads: leads.filter((l) => l.status === 'sold').length,
    totalEarnings: sales.reduce((sum, s) => sum + Number(s.commission_value ?? 0), 0),
    monthlyCommission: (() => {
      const now = new Date();
      return sales
        .filter((s) => {
          const sd = new Date(s.sale_date);
          return sd.getFullYear() === now.getFullYear() && sd.getMonth() === now.getMonth();
        })
        .reduce((sum, s) => sum + Number(s.commission_value ?? 0), 0);
    })(),
  };

  const now = new Date();
  const salesData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthSales = sales.filter((s) => {
      const sd = new Date(s.sale_date);
      return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth();
    });
    return {
      month: MONTH_LABELS[d.getMonth()],
      sales: monthSales.length,
      value: monthSales.reduce((sum, s) => sum + Number(s.sale_value ?? 0), 0),
    };
  });

  const leadStatusLabels: Record<string, string> = {
    new: 'Novos',
    contacted: 'Contatados',
    visit_scheduled: 'Visita Agendada',
    proposal_sent: 'Proposta Enviada',
    negotiating: 'Em Negociação',
    sold: 'Convertidos',
    lost: 'Perdidos',
    no_response: 'Sem Resposta',
  };
  const leadGroups: Record<string, number> = {};
  for (const lead of leads) {
    leadGroups[lead.status] = (leadGroups[lead.status] ?? 0) + 1;
  }
  const leadStatusData = Object.entries(leadGroups).map(([status, value], i) => ({
    name: leadStatusLabels[status] ?? status,
    value,
    color: ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'][i % 6],
  }));

  let recentSalesQuery = supabase
    .from('sales')
    .select('id, sale_value, commission_value, sale_date, property_id')
    .order('sale_date', { ascending: false })
    .limit(5);
  if (scopedToOwn) recentSalesQuery = recentSalesQuery.eq('realtor_id', user.id);
  const { data: recentSalesRaw } = await recentSalesQuery;

  let recentSales: {
    id: string;
    sale_value: number;
    commission_value: number;
    sale_date: string;
    propertyTitle: string;
  }[] = [];

  if (recentSalesRaw && recentSalesRaw.length > 0) {
    const propertyIds = recentSalesRaw.map((s) => s.property_id).filter(Boolean);
    const { data: soldProperties } = await supabase
      .from('properties')
      .select('id, title')
      .in('id', propertyIds);
    const titleById = new Map((soldProperties ?? []).map((p) => [p.id, p.title]));
    recentSales = recentSalesRaw.map((s) => ({
      ...s,
      propertyTitle: titleById.get(s.property_id) ?? 'Imóvel',
    }));
  }

  return NextResponse.json({
    realtorData,
    salesData,
    leadStatusData,
    recentSales,
  });
}
