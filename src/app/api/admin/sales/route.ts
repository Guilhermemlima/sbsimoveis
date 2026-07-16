import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageSales } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  let query = supabase
    .from('sales')
    .select('*, properties(title, code)')
    .order('sale_date', { ascending: false });

  if (!canManageSales(user)) {
    query = query.eq('realtor_id', user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sales = data ?? [];
  const realtorIds = [...new Set(sales.map((s) => s.realtor_id))];
  let namesById = new Map<string, string>();
  if (realtorIds.length > 0) {
    const { data: realtorUsers } = await supabase.from('users').select('id, name').in('id', realtorIds);
    namesById = new Map((realtorUsers ?? []).map((u) => [u.id, u.name]));
  }

  const enriched = sales.map((s) => ({ ...s, realtorName: namesById.get(s.realtor_id) ?? 'Corretor' }));
  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageSales(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const required = ['property_id', 'realtor_id', 'sale_value', 'sale_date'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === '') {
      return NextResponse.json({ error: `Campo obrigatório faltando: ${field}` }, { status: 400 });
    }
  }

  const supabase = createServiceRoleClient();

  const saleValue = Number(body.sale_value);
  const commissionPercentage = Number(body.commission_percentage ?? 0);
  const commissionValue = Number(
    body.commission_value ?? (saleValue * commissionPercentage) / 100
  );
  const costs = Number(body.costs ?? 0);
  const advertisingCosts = Number(body.advertising_costs ?? 0);
  const operationalCosts = Number(body.operational_costs ?? 0);
  const taxes = Number(body.taxes ?? 0);
  // commission_value is the agency's revenue from the sale. realtor_payment is an
  // optional additional split paid out to the realtor on top of/from that commission;
  // it defaults to 0 (no separate split tracked).
  const realtorPayment = Number(body.realtor_payment ?? 0);
  const grossProfit = commissionValue;
  const netProfit = grossProfit - costs - advertisingCosts - operationalCosts - taxes - realtorPayment;

  const { data, error } = await supabase
    .from('sales')
    .insert({
      property_id: body.property_id,
      realtor_id: body.realtor_id,
      client_id: body.client_id || null,
      lead_id: body.lead_id || null,
      sale_value: saleValue,
      commission_percentage: commissionPercentage,
      commission_value: commissionValue,
      costs,
      advertising_costs: advertisingCosts,
      operational_costs: operationalCosts,
      taxes,
      realtor_payment: realtorPayment,
      gross_profit: grossProfit,
      net_profit: netProfit,
      status: body.status ?? 'completed',
      notes: body.notes ?? '',
      sale_date: body.sale_date,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Mark the property as sold/rented so it stops appearing as available.
  const newStatus = body.purpose === 'rent' ? 'rented' : 'sold';
  await supabase.from('properties').update({ status: newStatus }).eq('id', body.property_id);

  return NextResponse.json(data, { status: 201 });
}
