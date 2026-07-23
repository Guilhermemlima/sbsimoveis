import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

const REQUIRED_FIELDS = ['property_id', 'type'];

export async function GET() {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const { data: inspections, error } = await supabase
    .from('inspections')
    .select('*, properties(title, code)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ownerIds = [...new Set((inspections ?? []).map((i) => i.owner_id).filter(Boolean))];
  const tenantIds = [...new Set((inspections ?? []).map((i) => i.tenant_id).filter(Boolean))];

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

  const enriched = (inspections ?? []).map((i) => ({
    ...i,
    ownerName: i.owner_id ? (ownerNameById.get(i.owner_id) ?? 'Proprietário') : null,
    tenantName: i.tenant_id ? (tenantNameById.get(i.tenant_id) ?? 'Inquilino') : null,
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
    if (!body[field]) {
      return NextResponse.json({ error: `Campo obrigatório faltando: ${field}` }, { status: 400 });
    }
  }

  const supabase = createServiceRoleClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .eq('id', body.property_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!property) {
    return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('inspections')
    .insert({
      property_id: body.property_id,
      lease_contract_id: body.lease_contract_id || null,
      owner_id: body.owner_id || null,
      tenant_id: body.tenant_id || null,
      type: body.type,
      custom_type_label: body.type === 'custom' ? body.custom_type_label || null : null,
      status: body.scheduled_date ? 'scheduled' : 'pending',
      scheduled_date: body.scheduled_date || null,
      scheduled_time: body.scheduled_time || null,
      performed_by: body.performed_by || null,
      notes: body.notes || null,
      created_by: user!.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const defaultEnvironments = ['Sala', 'Cozinha', 'Quartos', 'Banheiros'];
  const { data: environments } = await supabase
    .from('inspection_environments')
    .insert(defaultEnvironments.map((name, order_index) => ({ inspection_id: data.id, name, order_index })))
    .select();

  const STANDARD_ITEMS = [
    'Paredes',
    'Piso',
    'Teto',
    'Portas',
    'Janelas',
    'Pintura',
    'Iluminação',
    'Instalações elétricas',
    'Instalações hidráulicas',
    'Móveis',
    'Eletrodomésticos',
    'Chaves',
    'Fechaduras',
    'Vidros',
    'Limpeza',
    'Estado geral',
  ];

  if (environments && environments.length > 0) {
    const items = environments.flatMap((env) =>
      STANDARD_ITEMS.map((item_type) => ({ environment_id: env.id, item_type }))
    );
    await supabase.from('inspection_items').insert(items);
  }

  await logAudit({
    user: user!,
    action: 'create',
    entityType: 'inspection',
    entityId: data.id,
    description: `Criou uma vistoria (${body.type}) para o imóvel.`,
  });

  return NextResponse.json(data, { status: 201 });
}
