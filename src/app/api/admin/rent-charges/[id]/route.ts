import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

function isAuthorized(user: { role: string } | null) {
  return !!user && (user.role === 'admin' || user.role === 'realtor');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: charge } = await supabase
    .from('financial_transactions')
    .select(
      'id, type, property_id, lease_contract_id, owner_id, tenant_id, amount, competence_date, financial_categories(name)'
    )
    .eq('id', id)
    .maybeSingle();

  if (!charge) {
    return NextResponse.json({ error: 'Cobrança não encontrada.' }, { status: 404 });
  }

  if (!canManageAllProperties(user!)) {
    const { data: property } = await supabase
      .from('properties')
      .select('realtor_id')
      .eq('id', charge.property_id)
      .maybeSingle();
    if (!property || property.realtor_id !== user!.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status === 'paid') {
    updates.status = 'paid';
    updates.paid_date = body.paid_date || new Date().toISOString().slice(0, 10);
    updates.payment_method = body.payment_method || 'manual';
  } else if (body.status) {
    updates.status = body.status;
  }

  const { data, error } = await supabase
    .from('financial_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const categoryField = charge.financial_categories as unknown as { name: string }[] | { name: string } | null;
  const categoryName = Array.isArray(categoryField) ? categoryField[0]?.name : categoryField?.name;

  const isRentRevenue =
    body.status === 'paid' &&
    charge.type === 'revenue' &&
    categoryName === 'Aluguel Recebido' &&
    charge.lease_contract_id &&
    charge.owner_id;

  if (isRentRevenue) {
    const { data: lease } = await supabase
      .from('lease_contracts')
      .select('admin_fee_percentage')
      .eq('id', charge.lease_contract_id)
      .maybeSingle();

    const rentAmount = Number(charge.amount);
    const adminFeeAmount = lease ? rentAmount * (Number(lease.admin_fee_percentage) / 100) : 0;
    const netAmount = rentAmount - adminFeeAmount;

    await supabase.from('owner_payouts').insert({
      owner_id: charge.owner_id,
      property_id: charge.property_id,
      lease_contract_id: charge.lease_contract_id,
      rent_charge_id: charge.id,
      competence_date: charge.competence_date,
      rent_amount: rentAmount,
      admin_fee_amount: adminFeeAmount,
      deductions_amount: 0,
      net_amount: netAmount,
      status: 'pending',
    });
  }

  return NextResponse.json(data);
}
