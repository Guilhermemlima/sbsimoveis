import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, type SessionUser } from '@/lib/auth/session';
import { canManageLeads } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

const UPDATABLE_FIELDS = ['name', 'email', 'phone', 'source', 'internal_notes', 'property_id', 'realtor_id'];

const STATUS_LABEL: Record<string, string> = {
  new: 'Novo Lead',
  contacted: 'Primeiro Contato',
  visit_scheduled: 'Visita Agendada',
  proposal_sent: 'Proposta Enviada',
  negotiating: 'Negociação',
  contract: 'Contrato',
  sold: 'Concluído',
  lost: 'Perdido',
  no_response: 'Sem Resposta',
};

async function loadOwnedLead(id: string, user: SessionUser) {
  const supabase = createServiceRoleClient();
  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
  if (!lead) return { lead: null, supabase };
  if (!canManageLeads(user) && lead.realtor_id !== user.id) return { lead: null, supabase };
  return { lead, supabase };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const { lead, supabase } = await loadOwnedLead(id, user);
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });

  const { data: history } = await supabase
    .from('lead_status_history')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: true });

  const changedByIds = [...new Set((history ?? []).map((h) => h.changed_by).filter(Boolean))];
  let namesById = new Map<string, string>();
  if (changedByIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, name').in('id', changedByIds);
    namesById = new Map((users ?? []).map((u) => [u.id, u.name]));
  }

  const enrichedHistory = (history ?? []).map((h) => ({
    ...h,
    changedByName: h.changed_by ? namesById.get(h.changed_by) ?? null : null,
  }));

  return NextResponse.json({ ...lead, history: enrichedHistory });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const { lead, supabase } = await loadOwnedLead(id, user);
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key] === '' ? null : body[key];
  }

  const statusChanged = body.status !== undefined && body.status !== lead.status;
  if (statusChanged) {
    updates.status = body.status;
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (statusChanged) {
    await supabase.from('lead_status_history').insert({
      lead_id: id,
      from_status: lead.status,
      to_status: body.status,
      changed_by: user.id,
      note: body.status_note || null,
    });

    await logAudit({
      user,
      action: 'update_status',
      entityType: 'lead',
      entityId: id,
      description: `Moveu o lead "${data.name}" de "${STATUS_LABEL[lead.status] ?? lead.status}" para "${STATUS_LABEL[body.status] ?? body.status}".`,
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canManageLeads(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
