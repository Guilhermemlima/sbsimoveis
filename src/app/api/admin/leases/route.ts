import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties, canAccessBackOffice } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { validateLeaseOwners, saveLeaseOwners, primaryOwnerId, type LeaseOwnerInput } from '@/lib/lease-owners';
import { validateLeaseTenants, saveLeaseTenants, primaryTenantId, type LeaseTenantInput } from '@/lib/lease-tenants';

const REQUIRED_FIELDS = ['property_id', 'start_date', 'end_date', 'rent_value'];

const isAuthorized = canAccessBackOffice;

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

  const leaseIds = (leases ?? []).map((l) => l.id);
  const guarantorIds = [...new Set((leases ?? []).map((l) => l.guarantor_id).filter(Boolean))];

  const [coOwnersRes, coTenantsRes, guarantorsRes] = await Promise.all([
    leaseIds.length > 0
      ? supabase
          .from('lease_contract_owners')
          .select('lease_contract_id, owner_id, percentage, commission_rate, property_owners(name)')
          .in('lease_contract_id', leaseIds)
      : Promise.resolve({ data: [] }),
    leaseIds.length > 0
      ? supabase
          .from('lease_contract_tenants')
          .select('lease_contract_id, tenant_id, participation_percentage, tenants(name)')
          .in('lease_contract_id', leaseIds)
      : Promise.resolve({ data: [] }),
    guarantorIds.length > 0
      ? supabase.from('guarantors').select('id, name').in('id', guarantorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const guarantorNameById = new Map<string, string>();
  for (const g of guarantorsRes.data ?? []) {
    guarantorNameById.set(g.id, g.name);
  }

  const coOwnersByLease = new Map<string, { owner_id: string; name: string; percentage: number; commission_rate: number }[]>();
  for (const row of coOwnersRes.data ?? []) {
    const ownerRef = row.property_owners as unknown as { name: string } | { name: string }[] | null;
    const ownerName = Array.isArray(ownerRef) ? ownerRef[0]?.name : ownerRef?.name;
    const list = coOwnersByLease.get(row.lease_contract_id) ?? [];
    list.push({
      owner_id: row.owner_id,
      name: ownerName ?? 'Proprietário',
      percentage: Number(row.percentage),
      commission_rate: Number(row.commission_rate),
    });
    coOwnersByLease.set(row.lease_contract_id, list);
  }

  const coTenantsByLease = new Map<string, { tenant_id: string; name: string; participation_percentage: number }[]>();
  for (const row of coTenantsRes.data ?? []) {
    const tenantRef = row.tenants as unknown as { name: string } | { name: string }[] | null;
    const tenantName = Array.isArray(tenantRef) ? tenantRef[0]?.name : tenantRef?.name;
    const list = coTenantsByLease.get(row.lease_contract_id) ?? [];
    list.push({
      tenant_id: row.tenant_id,
      name: tenantName ?? 'Inquilino',
      participation_percentage: Number(row.participation_percentage),
    });
    coTenantsByLease.set(row.lease_contract_id, list);
  }

  const enriched = (leases ?? []).map((lease) => {
    const coOwners = (coOwnersByLease.get(lease.id) ?? []).sort((a, b) => b.percentage - a.percentage);
    const coTenants = (coTenantsByLease.get(lease.id) ?? []).sort(
      (a, b) => b.participation_percentage - a.participation_percentage
    );
    return {
      ...lease,
      owners: coOwners,
      tenants: coTenants,
      ownerName: coOwners.length > 0 ? coOwners.map((o) => o.name).join(', ') : 'Proprietário',
      tenantName: coTenants.length > 0 ? coTenants.map((t) => t.name).join(', ') : 'Inquilino',
      guarantorName: lease.guarantor_id ? guarantorNameById.get(lease.guarantor_id) ?? null : null,
    };
  });

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

  const owners: LeaseOwnerInput[] = Array.isArray(body.owners) && body.owners.length > 0
    ? body.owners.map((o: { owner_id: string; percentage: string | number; commission_rate?: string | number }) => ({
        owner_id: o.owner_id,
        percentage: Number(o.percentage),
        commission_rate: Number(o.commission_rate) || 0,
      }))
    : body.owner_id
      ? [{ owner_id: body.owner_id, percentage: 100, commission_rate: 0 }]
      : [];

  const ownersError = validateLeaseOwners(owners);
  if (ownersError) {
    return NextResponse.json({ error: ownersError }, { status: 400 });
  }

  const tenants: LeaseTenantInput[] = Array.isArray(body.tenants) && body.tenants.length > 0
    ? body.tenants.map((t: { tenant_id: string; participation_percentage: string | number }) => ({
        tenant_id: t.tenant_id,
        participation_percentage: Number(t.participation_percentage),
      }))
    : body.tenant_id
      ? [{ tenant_id: body.tenant_id, participation_percentage: 100 }]
      : [];

  const tenantsError = validateLeaseTenants(tenants);
  if (tenantsError) {
    return NextResponse.json({ error: tenantsError }, { status: 400 });
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
      owner_id: primaryOwnerId(owners),
      tenant_id: primaryTenantId(tenants),
      guarantor_id: body.guarantor_id || null,
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
      deposit_months: body.deposit_months ? Number(body.deposit_months) : null,
      deposit_received_date: Number(body.deposit_value) > 0 ? body.start_date : null,
      fiance_insurance_company: body.fiance_insurance_company || null,
      fiance_insurance_policy_number: body.fiance_insurance_policy_number || null,
      fiance_insurance_value: body.fiance_insurance_value ? Number(body.fiance_insurance_value) : null,
      fiance_insurance_start_date: body.fiance_insurance_start_date || null,
      fiance_insurance_end_date: body.fiance_insurance_end_date || null,
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

  const { error: ownersInsertError } = await saveLeaseOwners(supabase, data.id, owners);
  if (ownersInsertError) {
    await supabase.from('lease_contracts').delete().eq('id', data.id);
    return NextResponse.json({ error: ownersInsertError.message }, { status: 400 });
  }

  const { error: tenantsInsertError } = await saveLeaseTenants(supabase, data.id, tenants);
  if (tenantsInsertError) {
    await supabase.from('lease_contracts').delete().eq('id', data.id);
    return NextResponse.json({ error: tenantsInsertError.message }, { status: 400 });
  }

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
