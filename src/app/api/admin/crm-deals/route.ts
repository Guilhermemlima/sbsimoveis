import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageLeads } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { DEAL_TYPE_LABEL } from '@/lib/crm-stages';
import type { CrmDealType } from '@/types';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  let query = supabase
    .from('crm_deals')
    .select('*, properties(title, code)')
    .order('created_at', { ascending: false });

  // Corretor sem permissão de gestão vê apenas as próprias captações.
  if (!canManageLeads(user)) {
    query = query.eq('realtor_id', user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const deals = data ?? [];

  const [realtorNames, fileCounts] = await Promise.all([
    (async () => {
      const ids = [...new Set(deals.map((d) => d.realtor_id).filter(Boolean))];
      if (ids.length === 0) return new Map<string, string>();
      const { data: users } = await supabase.from('users').select('id, name').in('id', ids);
      return new Map((users ?? []).map((u) => [u.id, u.name]));
    })(),
    (async () => {
      const ids = deals.map((d) => d.id);
      if (ids.length === 0) return new Map<string, number>();
      const { data: files } = await supabase.from('crm_deal_files').select('deal_id').in('deal_id', ids);
      const map = new Map<string, number>();
      for (const f of files ?? []) map.set(f.deal_id, (map.get(f.deal_id) ?? 0) + 1);
      return map;
    })(),
  ]);

  const enriched = deals.map((d) => ({
    ...d,
    realtorName: d.realtor_id ? realtorNames.get(d.realtor_id) ?? null : null,
    fileCount: fileCounts.get(d.id) ?? 0,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const title = String(body.title ?? '').trim();
  const dealType = body.deal_type as CrmDealType;

  if (!title) {
    return NextResponse.json({ error: 'Informe um título para a captação.' }, { status: 400 });
  }
  if (dealType !== 'venda' && dealType !== 'locacao') {
    return NextResponse.json({ error: 'Escolha se é venda ou locação.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const realtorId = canManageLeads(user) && body.realtor_id ? body.realtor_id : user.role === 'realtor' ? user.id : null;

  const { data, error } = await supabase
    .from('crm_deals')
    .insert({
      deal_type: dealType,
      title,
      stage: 'assinatura_opcao',
      property_id: body.property_id || null,
      property_address: body.property_address || null,
      owner_name: body.owner_name || null,
      owner_phone: body.owner_phone || null,
      owner_email: body.owner_email || null,
      deal_value: body.deal_value ? Number(body.deal_value) : null,
      realtor_id: realtorId,
      notes: body.notes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('crm_deal_stage_history').insert({
    deal_id: data.id,
    from_stage: null,
    to_stage: 'assinatura_opcao',
    changed_by: user.id,
  });

  await logAudit({
    user,
    action: 'create',
    entityType: 'crm_deal',
    entityId: data.id,
    description: `Abriu a captação "${title}" (${DEAL_TYPE_LABEL[dealType]}).`,
  });

  return NextResponse.json(data, { status: 201 });
}
