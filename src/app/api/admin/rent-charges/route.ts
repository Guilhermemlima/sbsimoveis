import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

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
    .from('financial_transactions')
    .select('*, properties(title, code), financial_categories(name)')
    .eq('center', 'rental')
    .order('due_date', { ascending: false });

  if (!canManageAllProperties(user!)) {
    const { data: ownProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('realtor_id', user!.id);
    const ids = (ownProperties ?? []).map((p) => p.id);
    query = query.in('property_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000']);
  }

  const { data: charges, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tenantIds = [...new Set((charges ?? []).map((c) => c.tenant_id).filter(Boolean))];
  let tenantNameById = new Map<string, string>();
  if (tenantIds.length > 0) {
    const { data: tenants } = await supabase.from('tenants').select('id, name').in('id', tenantIds);
    tenantNameById = new Map((tenants ?? []).map((t) => [t.id, t.name]));
  }

  const enriched = (charges ?? []).map((c) => ({
    ...c,
    tenantName: c.tenant_id ? tenantNameById.get(c.tenant_id) ?? 'Inquilino' : null,
    categoryName: c.financial_categories?.name ?? null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const required = ['lease_contract_id', 'category_id', 'description', 'amount', 'due_date'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === '') {
      return NextResponse.json({ error: `Campo obrigatório faltando: ${field}` }, { status: 400 });
    }
  }

  const supabase = createServiceRoleClient();
  const { data: lease } = await supabase
    .from('lease_contracts')
    .select('id, property_id, owner_id, tenant_id, realtor_id')
    .eq('id', body.lease_contract_id)
    .maybeSingle();

  if (!lease) {
    return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
  }
  if (!canManageAllProperties(user!) && lease.realtor_id !== user!.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('financial_transactions')
    .insert({
      type: 'revenue',
      center: 'rental',
      category_id: body.category_id,
      property_id: lease.property_id,
      lease_contract_id: lease.id,
      owner_id: lease.owner_id,
      tenant_id: lease.tenant_id,
      created_by: user!.id,
      description: body.description,
      amount: Number(body.amount),
      competence_date: body.competence_date || body.due_date,
      due_date: body.due_date,
      status: 'pending',
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
