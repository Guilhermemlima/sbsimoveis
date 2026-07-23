import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const UPDATABLE_FIELDS = [
  'end_date',
  'due_day',
  'rent_value',
  'admin_fee_percentage',
  'water_responsible',
  'energy_responsible',
  'iptu_responsible',
  'insurance_responsible',
  'condo_responsible',
  'deposit_value',
  'status',
  'notes',
];

const RETENTION_FIELDS = [
  'first_rent_retention_type',
  'first_rent_retention_percentage',
  'first_rent_retention_fixed_amount',
  'first_rent_retention_basis',
  'first_rent_retention_include_extra_fees',
  'first_rent_retention_installments',
  'first_rent_retention_notes',
];

const ENDED_STATUSES = ['terminated', 'cancelled', 'expired'];

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('lease_contracts')
    .select('id, property_id, realtor_id, status, first_rent_retention_installments_applied')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
  }
  if (!canManageAllProperties(user!) && existing.realtor_id !== user!.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();

  const wantsRetentionChange = RETENTION_FIELDS.some((key) => body[key] !== undefined);
  if (wantsRetentionChange && existing.first_rent_retention_installments_applied > 0) {
    return NextResponse.json(
      { error: 'A retenção do primeiro aluguel já foi aplicada e não pode mais ser alterada.' },
      { status: 409 }
    );
  }

  const updates: Record<string, unknown> = {};
  for (const key of [...UPDATABLE_FIELDS, ...RETENTION_FIELDS]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('lease_contracts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (ENDED_STATUSES.includes(data.status) && !ENDED_STATUSES.includes(existing.status)) {
    await supabase.from('properties').update({ status: 'available' }).eq('id', existing.property_id);
  }

  return NextResponse.json(data);
}
