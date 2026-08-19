import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, type SessionUser } from '@/lib/auth/session';
import { canManageLeads } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { stageLabel } from '@/lib/crm-stages';
import { garantirProprietario, garantirInquilino, garantirComprador } from '@/lib/crm-autocreate';
import { syncCrmFile } from '@/lib/crm-sync';

const BUCKET = 'property-documents';
const SIGNED_URL_TTL_SECONDS = 3600;

const UPDATABLE_FIELDS = [
  'title',
  'deal_type',
  'property_id',
  'property_address',
  'owner_name',
  'owner_phone',
  'owner_email',
  'client_name',
  'client_phone',
  'client_email',
  'deal_value',
  'realtor_id',
  'notes',
  'owner_id',
  'tenant_id',
  'guarantor_id',
  'client_id',
  'owner_document',
  'owner_rg',
  'owner_address',
  'client_document',
  'client_rg',
  'client_address',
];

async function loadOwnedDeal(id: string, user: SessionUser) {
  const supabase = createServiceRoleClient();
  const { data: deal } = await supabase.from('crm_deals').select('*').eq('id', id).maybeSingle();
  if (!deal) return { deal: null, supabase };
  if (!canManageLeads(user) && deal.realtor_id !== user.id) return { deal: null, supabase };
  return { deal, supabase };
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
  const supabase = createServiceRoleClient();

  const { data: deal } = await supabase
    .from('crm_deals')
    .select('*, properties(title, code)')
    .eq('id', id)
    .maybeSingle();

  if (!deal) return NextResponse.json({ error: 'Captação não encontrada.' }, { status: 404 });
  if (!canManageLeads(user) && deal.realtor_id !== user.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const [historyRes, filesRes] = await Promise.all([
    supabase.from('crm_deal_stage_history').select('*').eq('deal_id', id).order('created_at'),
    supabase.from('crm_deal_files').select('*').eq('deal_id', id).order('created_at', { ascending: false }),
  ]);

  const userIds = [
    ...new Set([deal.realtor_id, ...(historyRes.data ?? []).map((h) => h.changed_by)].filter(Boolean)),
  ];
  let namesById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, name').in('id', userIds);
    namesById = new Map((users ?? []).map((u) => [u.id, u.name]));
  }

  const files = await Promise.all(
    (filesRes.data ?? []).map(async (f) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(f.file_path, SIGNED_URL_TTL_SECONDS);
      return { ...f, downloadUrl: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json({
    ...deal,
    realtorName: deal.realtor_id ? namesById.get(deal.realtor_id) ?? null : null,
    history: (historyRes.data ?? []).map((h) => ({
      ...h,
      changedByName: h.changed_by ? namesById.get(h.changed_by) ?? null : null,
    })),
    files,
  });
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
  const { deal, supabase } = await loadOwnedDeal(id, user);
  if (!deal) return NextResponse.json({ error: 'Captação não encontrada.' }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (body[key] === undefined) continue;
    if (key === 'deal_value') {
      updates[key] = body[key] === '' || body[key] === null ? null : Number(body[key]);
    } else {
      updates[key] = body[key] === '' ? null : body[key];
    }
  }

  const stageChanged = body.stage !== undefined && body.stage !== deal.stage;
  if (stageChanged) {
    updates.stage = body.stage;
    // Fecha a captação ao chegar no contrato assinado (ou ao ser perdida).
    if (body.stage === 'contrato_assinado' || body.stage === 'perdido') {
      updates.closed_at = new Date().toISOString();
    } else {
      updates.closed_at = null;
    }
  }

  // Cria o cadastro real a partir do que foi digitado, quando ainda não há
  // um vinculado — o mesmo comportamento da criação da captação.
  const avisos: string[] = [];

  if (!deal.owner_id && !body.owner_id && (body.owner_name || deal.owner_name)) {
    const ownerId = await garantirProprietario(supabase, {
      name: body.owner_name ?? deal.owner_name,
      email: body.owner_email ?? deal.owner_email,
      phone: body.owner_phone ?? deal.owner_phone,
      document_number: body.owner_document ?? deal.owner_document,
      rg: body.owner_rg ?? deal.owner_rg,
      address: body.owner_address ?? deal.owner_address,
    });
    if (ownerId) updates.owner_id = ownerId;
  }

  // O cliente vira inquilino (locação) ou comprador (venda).
  const clientName = body.client_name ?? deal.client_name;
  const semClienteVinculado = !deal.tenant_id && !deal.client_id && !body.tenant_id && !body.client_id;

  if (semClienteVinculado && clientName) {
    const pessoa = {
      name: clientName,
      email: body.client_email ?? deal.client_email,
      phone: body.client_phone ?? deal.client_phone,
      document_number: body.client_document ?? deal.client_document,
      rg: body.client_rg ?? deal.client_rg,
      address: body.client_address ?? deal.client_address,
    };

    if (deal.deal_type === 'locacao') {
      const tenantId = await garantirInquilino(supabase, pessoa);
      if (tenantId) updates.tenant_id = tenantId;
    } else {
      const { id: clientId, aviso } = await garantirComprador(supabase, pessoa);
      if (clientId) updates.client_id = clientId;
      if (aviso) avisos.push(aviso);
    }
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('crm_deals').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Com os cadastros criados, tenta enviar os anexos que estavam pendentes.
  let anexosSincronizados = 0;
  if (updates.owner_id || updates.tenant_id || updates.client_id) {
    const { data: pendentes } = await supabase
      .from('crm_deal_files')
      .select('*')
      .eq('deal_id', id)
      .is('synced_to', null);

    for (const file of pendentes ?? []) {
      const sync = await syncCrmFile(supabase, data, file, user.id);
      if (sync.synced_to || sync.synced_error) {
        await supabase
          .from('crm_deal_files')
          .update({
            synced_to: sync.synced_to,
            synced_ref_id: sync.synced_ref_id,
            synced_error: sync.synced_error,
            synced_at: sync.synced_to ? new Date().toISOString() : null,
          })
          .eq('id', file.id);
      }
      if (sync.synced_to) anexosSincronizados += 1;
    }
  }

  if (stageChanged) {
    await supabase.from('crm_deal_stage_history').insert({
      deal_id: id,
      from_stage: deal.stage,
      to_stage: body.stage,
      changed_by: user.id,
      note: body.stage_note || null,
    });

    await logAudit({
      user,
      action: 'update_stage',
      entityType: 'crm_deal',
      entityId: id,
      description: `Moveu a captação "${data.title}" de "${stageLabel(deal.stage)}" para "${stageLabel(body.stage)}".`,
    });
  }

  return NextResponse.json({ ...data, avisos, anexosSincronizados });
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

  // Remove os arquivos do storage antes de apagar o registro.
  const { data: files } = await supabase.from('crm_deal_files').select('file_path').eq('deal_id', id);
  const paths = (files ?? []).map((f) => f.file_path);
  if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);

  const { error } = await supabase.from('crm_deals').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
