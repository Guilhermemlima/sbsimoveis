import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

const REQUIRED_FIELDS = ['property_id', 'owner_id', 'tenant_id', 'start_date', 'end_date', 'rent_value'];

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

export async function GET() {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  let query = supabase
    .from('lease_contracts')
    .select('*, properties(title, code, city, neighborhood)')
    .order('created_at', { ascending: false });

  if (!canManageAllProperties(user!)) {
    query = query.eq('realtor_id', user!.id);
  }

  const { data: leases, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ownerIds = [...new Set((leases ?? []).map((l) => l.owner_id))];
  const tenantIds = [...new Set((leases ?? []).map((l) => l.tenant_id))];

  const [ownersRes, tenantsRes] = await Promise.all([
    ownerIds.length > 0
      ? supabase.from('property_owners').select('id, name').in('id', ownerIds)
      : Promise.resolve({ data: [] }),
    tenantIds.length > 0
      ? supabase.from('tenants').select('id, name').in('id', tenantIds)
      : Promise.resolve({ data: [] }),
  ]);

  const ownerNameById = new Map((ownersRes.data ?? []).map((o) => [o.id, o.name]));
  const tenantNameById = new Map((tenantsRes.data ?? []).map((t) => [t.id, t.name]));

  const enriched = (leases ?? []).map((lease) => ({
    ...lease,
    ownerName: ownerNameById.get(lease.owner_id) ?? 'Proprietário',
    tenantName: tenantNameById.get(lease.tenant_id) ?? 'Inquilino',
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === '') {
      return NextResponse.json({ error: `Campo obrigatório faltando: ${field}` }, { status: 400 });
    }
  }

  const supabase = createServiceRoleClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id, realtor_id, purpose')
    .eq('id', body.property_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!property) {
    return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  }
  if (!canManageAllProperties(user!) && property.realtor_id !== user!.id) {
    return NextResponse.json({ error: 'Não autorizado para este imóvel.' }, { status: 403 });
  }

  const { data: activeExisting } = await supabase
    .from('lease_contracts')
    .select('id')
    .eq('property_id', body.property_id)
    .eq('status', 'active')
    .maybeSingle();

  if (activeExisting) {
    return NextResponse.json(
      { error: 'Este imóvel já tem um contrato de locação ativo.' },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from('lease_contracts')
    .insert({
      property_id: body.property_id,
      owner_id: body.owner_id,
      tenant_id: body.tenant_id,
      realtor_id: property.realtor_id,
      start_date: body.start_date,
      end_date: body.end_date,
      due_day: Number(body.due_day) || 10,
      rent_value: Number(body.rent_value),
      admin_fee_percentage: Number(body.admin_fee_percentage) || 10,
      water_responsible: body.water_responsible || 'tenant',
      energy_responsible: body.energy_responsible || 'tenant',
      iptu_responsible: body.iptu_responsible || 'owner',
      insurance_responsible: body.insurance_responsible || 'tenant',
      condo_responsible: body.condo_responsible || 'tenant',
      deposit_value: Number(body.deposit_value) || 0,
      deposit_received_date: Number(body.deposit_value) > 0 ? body.start_date : null,
      first_rent_retention_type: body.first_rent_retention_type || 'none',
      first_rent_retention_percentage:
        body.first_rent_retention_type === 'custom_percentage'
          ? Number(body.first_rent_retention_percentage) || 0
          : null,
      first_rent_retention_fixed_amount:
        body.first_rent_retention_type === 'custom_amount'
          ? Number(body.first_rent_retention_fixed_amount) || 0
          : null,
      first_rent_retention_basis: body.first_rent_retention_basis || 'gross',
      first_rent_retention_include_extra_fees: !!body.first_rent_retention_include_extra_fees,
      first_rent_retention_installments: Number(body.first_rent_retention_installments) || 1,
      first_rent_retention_notes: body.first_rent_retention_notes || null,
      first_rent_retention_configured_by:
        body.first_rent_retention_type && body.first_rent_retention_type !== 'none' ? user!.id : null,
      status: 'active',
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('properties').update({ status: 'rented' }).eq('id', body.property_id);

  await logAudit({
    user: user!,
    action: 'create',
    entityType: 'lease_contract',
    entityId: data.id,
    description: `Criou o contrato de locação do imóvel (R$ ${Number(data.rent_value).toFixed(2)}/mês).`,
  });

  return NextResponse.json(data, { status: 201 });
}
