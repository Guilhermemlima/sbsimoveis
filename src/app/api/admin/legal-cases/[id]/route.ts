import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessLegal } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

const UPDATABLE_FIELDS = [
  'title',
  'description',
  'case_type',
  'lease_contract_id',
  'tenant_id',
  'owner_id',
  'process_number',
  'court',
  'responsible_id',
  'deadline_date',
  'notes',
];

const STATUS_LABEL: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  awaiting_response: 'Aguardando Resposta',
  resolved: 'Resolvido',
  archived: 'Arquivado',
};

const BUCKET = 'property-documents';
const SIGNED_URL_TTL_SECONDS = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canAccessLegal(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: legalCase } = await supabase
    .from('legal_cases')
    .select('*, properties(title, code), tenants(name), property_owners(name)')
    .eq('id', id)
    .maybeSingle();

  if (!legalCase) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 });

  const { data: history } = await supabase
    .from('legal_case_status_history')
    .select('*')
    .eq('legal_case_id', id)
    .order('created_at', { ascending: true });

  const { data: documents } = await supabase
    .from('legal_case_documents')
    .select('*')
    .eq('legal_case_id', id)
    .order('created_at', { ascending: false });

  const userIds = [
    ...new Set([legalCase.responsible_id, ...(history ?? []).map((h) => h.changed_by)].filter(Boolean)),
  ];
  let namesById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, name').in('id', userIds);
    namesById = new Map((users ?? []).map((u) => [u.id, u.name]));
  }

  const enrichedHistory = (history ?? []).map((h) => ({
    ...h,
    changedByName: h.changed_by ? namesById.get(h.changed_by) ?? null : null,
  }));

  const enrichedDocuments = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.file_path, SIGNED_URL_TTL_SECONDS);
      return { ...doc, downloadUrl: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json({
    ...legalCase,
    responsibleName: legalCase.responsible_id ? namesById.get(legalCase.responsible_id) ?? null : null,
    history: enrichedHistory,
    documents: enrichedDocuments,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canAccessLegal(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase.from('legal_cases').select('*').eq('id', id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key] === '' ? null : body[key];
  }

  const statusChanged = body.status !== undefined && body.status !== existing.status;
  if (statusChanged) {
    updates.status = body.status;
    if (body.status === 'resolved' || body.status === 'archived') {
      updates.closed_date = updates.closed_date ?? new Date().toISOString().slice(0, 10);
    }
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('legal_cases').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (statusChanged) {
    await supabase.from('legal_case_status_history').insert({
      legal_case_id: id,
      from_status: existing.status,
      to_status: body.status,
      changed_by: user!.id,
      note: body.status_note || null,
    });

    await logAudit({
      user: user!,
      action: 'update_status',
      entityType: 'legal_case',
      entityId: id,
      description: `Moveu o caso "${data.title}" de "${STATUS_LABEL[existing.status] ?? existing.status}" para "${STATUS_LABEL[body.status] ?? body.status}".`,
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canAccessLegal(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('legal_cases').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
