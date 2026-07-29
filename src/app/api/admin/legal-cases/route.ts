import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessLegal } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

const CASE_TYPE_LABEL: Record<string, string> = {
  contract: 'Contrato',
  termination: 'Distrato',
  notification: 'Notificação Extrajudicial',
  collection: 'Cobrança Judicial',
  eviction: 'Ação de Despejo',
  lawsuit: 'Processo Judicial',
  other: 'Outro',
};

export async function GET() {
  const user = await getCurrentUser();
  if (!canAccessLegal(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('legal_cases')
    .select('*, properties(title, code), tenants(name), property_owners(name)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cases = data ?? [];
  const responsibleIds = [...new Set(cases.map((c) => c.responsible_id).filter(Boolean))];
  let namesById = new Map<string, string>();
  if (responsibleIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, name').in('id', responsibleIds);
    namesById = new Map((users ?? []).map((u) => [u.id, u.name]));
  }

  const enriched = cases.map((c) => ({
    ...c,
    responsibleName: c.responsible_id ? namesById.get(c.responsible_id) ?? null : null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!canAccessLegal(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const required = ['property_id', 'case_type', 'title'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === '') {
      return NextResponse.json({ error: `Campo obrigatório faltando: ${field}` }, { status: 400 });
    }
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('legal_cases')
    .insert({
      property_id: body.property_id,
      lease_contract_id: body.lease_contract_id || null,
      tenant_id: body.tenant_id || null,
      owner_id: body.owner_id || null,
      case_type: body.case_type,
      title: body.title,
      description: body.description || null,
      process_number: body.process_number || null,
      court: body.court || null,
      responsible_id: body.responsible_id || user!.id,
      opened_date: body.opened_date || new Date().toISOString().slice(0, 10),
      deadline_date: body.deadline_date || null,
      notes: body.notes || null,
      created_by: user!.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('legal_case_status_history').insert({
    legal_case_id: data.id,
    from_status: null,
    to_status: 'open',
    changed_by: user!.id,
  });

  await logAudit({
    user: user!,
    action: 'create',
    entityType: 'legal_case',
    entityId: data.id,
    description: `Abriu o caso jurídico "${data.title}" (${CASE_TYPE_LABEL[data.case_type] ?? data.case_type}).`,
  });

  return NextResponse.json(data, { status: 201 });
}
