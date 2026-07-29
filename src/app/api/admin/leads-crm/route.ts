import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageLeads } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  let query = supabase
    .from('leads')
    .select('*, properties(title, code)')
    .order('created_at', { ascending: false });

  if (!canManageLeads(user)) {
    query = query.eq('realtor_id', user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const leads = data ?? [];
  const realtorIds = [...new Set(leads.map((l) => l.realtor_id).filter(Boolean))];
  let namesById = new Map<string, string>();
  if (realtorIds.length > 0) {
    const { data: realtorUsers } = await supabase.from('users').select('id, name').in('id', realtorIds);
    namesById = new Map((realtorUsers ?? []).map((u) => [u.id, u.name]));
  }

  const enriched = leads.map((l) => ({
    ...l,
    realtorName: l.realtor_id ? namesById.get(l.realtor_id) ?? 'Corretor' : null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();

  if (!name || !phone) {
    return NextResponse.json({ error: 'Nome e telefone são obrigatórios.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const realtorId =
    canManageLeads(user) && body.realtor_id
      ? body.realtor_id
      : user.role === 'realtor'
        ? user.id
        : null;

  const { data, error } = await supabase
    .from('leads')
    .insert({
      name,
      phone,
      email: body.email || null,
      property_id: body.property_id || null,
      client_id: body.client_id || null,
      realtor_id: realtorId,
      source: body.source || 'other',
      status: 'new',
      internal_notes: body.internal_notes || '',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('lead_status_history').insert({
    lead_id: data.id,
    from_status: null,
    to_status: 'new',
    changed_by: user.id,
  });

  await logAudit({
    user,
    action: 'create',
    entityType: 'lead',
    entityId: data.id,
    description: `Cadastrou o lead "${name}".`,
  });

  return NextResponse.json(data, { status: 201 });
}
