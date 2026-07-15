import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const [propertiesRes, realtorsRes, clientsRes, salesRes, leadsRes] = await Promise.all([
    supabase.from('properties').select('id, status, type').is('deleted_at', null),
    supabase.from('realtors').select('id').eq('status', 'active'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'client'),
    supabase
      .from('sales')
      .select('id, sale_value, gross_profit, net_profit, commission_value, sale_date, realtor_id, property_id'),
    supabase.from('leads').select('id, status'),
  ]);

  const properties = propertiesRes.data ?? [];
  const realtorCount = realtorsRes.data?.length ?? 0;
  const clientCount = clientsRes.count ?? 0;
  const sales = salesRes.data ?? [];
  const leads = leadsRes.data ?? [];

  const stats = {
    totalProperties: properties.length,
    availableProperties: properties.filter((p) => p.status === 'available').length,
    soldProperties: properties.filter((p) => p.status === 'sold').length,
    rentedProperties: properties.filter((p) => p.status === 'rented').length,
    totalRealtors: realtorCount,
    totalClients: clientCount,
    totalSales: sales.length,
    grossProfit: sales.reduce((sum, s) => sum + Number(s.gross_profit ?? 0), 0),
    netProfit: sales.reduce((sum, s) => sum + Number(s.net_profit ?? 0), 0),
    totalCommissions: sales.reduce((sum, s) => sum + Number(s.commission_value ?? 0), 0),
    conversionRate:
      leads.length > 0
        ? Math.round((leads.filter((l) => l.status === 'sold').length / leads.length) * 100)
        : 0,
  };

  // Last 6 months of sales
  const now = new Date();
  const monthlySales = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthSales = sales.filter((s) => {
      const sd = new Date(s.sale_date);
      return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth();
    });
    return {
      month: MONTH_LABELS[d.getMonth()],
      sales: monthSales.length,
      value: monthSales.reduce((sum, s) => sum + Number(s.sale_value ?? 0), 0),
      profit: monthSales.reduce((sum, s) => sum + Number(s.net_profit ?? 0), 0),
    };
  });

  // Realtor performance (only realtors with at least one sale)
  const realtorIds = [...new Set(sales.map((s) => s.realtor_id).filter(Boolean))];
  let realtorPerformance: { name: string; sales: number; value: number }[] = [];
  if (realtorIds.length > 0) {
    const { data: realtorUsers } = await supabase
      .from('users')
      .select('id, name')
      .in('id', realtorIds);
    const nameById = new Map((realtorUsers ?? []).map((u) => [u.id, u.name]));
    realtorPerformance = realtorIds.map((id) => {
      const realtorSales = sales.filter((s) => s.realtor_id === id);
      return {
        name: nameById.get(id) ?? 'Corretor',
        sales: realtorSales.length,
        value: realtorSales.reduce((sum, s) => sum + Number(s.sale_value ?? 0), 0),
      };
    });
  }

  // Lead status breakdown
  const leadStatusGroups: Record<string, number> = {};
  for (const lead of leads) {
    leadStatusGroups[lead.status] = (leadStatusGroups[lead.status] ?? 0) + 1;
  }
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
  const conversionData = Object.entries(leadStatusGroups).map(([status, value]) => ({
    name: leadStatusLabels[status] ?? status,
    value,
  }));

  // Sales by property type
  const propertyTypeById = new Map(properties.map((p) => [p.id, p.type]));
  const typeGroups: Record<string, { count: number; value: number }> = {};
  for (const sale of sales) {
    const type = propertyTypeById.get(sale.property_id) ?? 'other';
    if (!typeGroups[type]) typeGroups[type] = { count: 0, value: 0 };
    typeGroups[type].count += 1;
    typeGroups[type].value += Number(sale.sale_value ?? 0);
  }
  const typeLabels: Record<string, string> = {
    house: 'Casa',
    apartment: 'Apartamento',
    commercial: 'Comercial',
    land: 'Terreno',
    garage: 'Garagem',
    farm: 'Fazenda',
    other: 'Outro',
  };
  const propertyTypeSales = Object.entries(typeGroups).map(([type, g]) => ({
    type: typeLabels[type] ?? type,
    sales: g.count,
    value: g.value,
  }));

  // Recent leads (most useful "recent activity" backed by real data)
  const { data: recentLeadsRaw } = await supabase
    .from('leads')
    .select('id, name, status, source, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    stats,
    monthlySales,
    realtorPerformance,
    conversionData,
    propertyTypeSales,
    recentLeads: recentLeadsRaw ?? [],
  });
}
