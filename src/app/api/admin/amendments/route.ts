import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { formatDateBR } from '@/lib/format';
import { formatAmendmentValue, renderAmendmentTemplate } from '@/lib/amendments';

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const leaseId = searchParams.get('lease_contract_id');

  const supabase = createServiceRoleClient();

  let query = supabase
    .from('lease_amendments')
    .select('*, lease_contracts(id, property_id, properties(title, code))')
    .order('created_at', { ascending: false });

  if (leaseId) query = query.eq('lease_contract_id', leaseId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  if (!body.lease_contract_id || !body.type || !body.title) {
    return NextResponse.json({ error: 'Contrato, tipo e título são obrigatórios.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: lease } = await supabase
    .from('lease_contracts')
    .select('id, property_id, owner_id, tenant_id, rent_value, end_date, properties(title, code)')
    .eq('id', body.lease_contract_id)
    .maybeSingle();

  if (!lease) return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });

  const propertyField = lease.properties as unknown as
    | { title: string; code: string }[]
    | { title: string; code: string }
    | null;
  const property = Array.isArray(propertyField) ? propertyField[0] : propertyField;

  const changes: Record<string, { from: unknown; to: unknown }> = body.changes ?? {};

  const referencedIds = new Set<string>();
  for (const key of ['tenant_id', 'owner_id']) {
    if (changes[key]) {
      if (changes[key].from) referencedIds.add(String(changes[key].from));
      if (changes[key].to) referencedIds.add(String(changes[key].to));
    }
  }
  if (lease.owner_id) referencedIds.add(lease.owner_id);
  if (lease.tenant_id) referencedIds.add(lease.tenant_id);

  const names = new Map<string, string>();
  if (referencedIds.size > 0) {
    const idList = [...referencedIds];
    const [{ data: owners }, { data: tenants }] = await Promise.all([
      supabase.from('property_owners').select('id, name').in('id', idList),
      supabase.from('tenants').select('id, name').in('id', idList),
    ]);
    for (const o of owners ?? []) names.set(o.id, o.name);
    for (const t of tenants ?? []) names.set(t.id, t.name);
  }

  const context: Record<string, string> = {
    property_title: property?.title ?? '',
    property_code: property?.code ?? '',
    owner_name: lease.owner_id ? (names.get(lease.owner_id) ?? '') : '',
    tenant_name: lease.tenant_id ? (names.get(lease.tenant_id) ?? '') : '',
    effective_date: body.effective_date ? formatDateBR(body.effective_date) : '',
  };

  for (const [key, change] of Object.entries(changes)) {
    context[`${key}_from`] = formatAmendmentValue(key, change.from, names);
    context[`${key}_to`] = formatAmendmentValue(key, change.to, names);
  }

  let contentTemplate = body.content;
  let templateId: string | null = null;
  if (!contentTemplate && body.template_id) {
    const { data: template } = await supabase
      .from('amendment_templates')
      .select('id, content_template')
      .eq('id', body.template_id)
      .maybeSingle();
    if (template) {
      contentTemplate = template.content_template;
      templateId = template.id;
    }
  }
  if (!contentTemplate) {
    return NextResponse.json({ error: 'Selecione um modelo ou informe o conteúdo do aditivo.' }, { status: 400 });
  }

  const content = renderAmendmentTemplate(contentTemplate, context);

  const { count } = await supabase
    .from('lease_amendments')
    .select('id', { count: 'exact', head: true })
    .eq('lease_contract_id', body.lease_contract_id);

  const { data, error } = await supabase
    .from('lease_amendments')
    .insert({
      lease_contract_id: body.lease_contract_id,
      template_id: templateId,
      type: body.type,
      version: (count ?? 0) + 1,
      title: body.title,
      content,
      changes,
      status: 'draft',
      effective_date: body.effective_date || null,
      created_by: user!.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit({
    user: user!,
    action: 'create',
    entityType: 'lease_amendment',
    entityId: data.id,
    description: `Criou o aditivo "${data.title}" (versão ${data.version}) para o contrato.`,
  });

  return NextResponse.json(data, { status: 201 });
}
