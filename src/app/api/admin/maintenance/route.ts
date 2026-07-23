import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

export async function GET() {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const { data: requests, error } = await supabase
    .from('maintenance_requests')
    .select('*, properties(title, code)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ownerIds = [...new Set((requests ?? []).map((r) => r.owner_id).filter(Boolean))];
  const tenantIds = [...new Set((requests ?? []).map((r) => r.tenant_id).filter(Boolean))];

  const [{ data: owners }, { data: tenants }] = await Promise.all([
    ownerIds.length
      ? supabase.from('property_owners').select('id, name').in('id', ownerIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    tenantIds.length
      ? supabase.from('tenants').select('id, name').in('id', tenantIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const ownerNameById = new Map((owners ?? []).map((o) => [o.id, o.name]));
  const tenantNameById = new Map((tenants ?? []).map((t) => [t.id, t.name]));

  const enriched = (requests ?? []).map((r) => ({
    ...r,
    ownerName: r.owner_id ? (ownerNameById.get(r.owner_id) ?? null) : null,
    tenantName: r.tenant_id ? (tenantNameById.get(r.tenant_id) ?? null) : null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  if (!body.property_id || !body.title) {
    return NextResponse.json({ error: 'Imóvel e título são obrigatórios.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('maintenance_requests')
    .insert({
      property_id: body.property_id,
      lease_contract_id: body.lease_contract_id || null,
      inspection_id: body.inspection_id || null,
      owner_id: body.owner_id || null,
      tenant_id: body.tenant_id || null,
      title: body.title,
      description: body.description || null,
      category: body.category || 'other',
      priority: body.priority || 'normal',
      status: 'requested',
      estimated_cost: body.estimated_cost || null,
      requested_by: user!.id,
      created_by: user!.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit({
    user: user!,
    action: 'create',
    entityType: 'maintenance_request',
    entityId: data.id,
    description: `Abriu a solicitação de manutenção "${data.title}".`,
  });

  return NextResponse.json(data, { status: 201 });
}
