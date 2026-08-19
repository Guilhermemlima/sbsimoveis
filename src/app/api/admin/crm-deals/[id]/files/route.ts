import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageLeads } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { ALL_STAGES } from '@/lib/crm-stages';
import { syncCrmFile } from '@/lib/crm-sync';

const BUCKET = 'property-documents';
const MAX_SIZE = 15 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 3600;

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

  const { data: files, error } = await supabase
    .from('crm_deal_files')
    .select('*')
    .eq('deal_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (files ?? []).map(async (f) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(f.file_path, SIGNED_URL_TTL_SECONDS);
      return { ...f, downloadUrl: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(
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
    .select(
      'id, realtor_id, title, property_id, owner_id, tenant_id, guarantor_id, client_id, inspection_id'
    )
    .eq('id', id)
    .maybeSingle();

  if (!deal) return NextResponse.json({ error: 'Captação não encontrada.' }, { status: 404 });
  if (!canManageLeads(user) && deal.realtor_id !== user.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const formData = await request.formData();
  const stage = String(formData.get('stage') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const files = formData.getAll('file').filter((f): f is File => f instanceof File);

  if (!ALL_STAGES.some((s) => s.value === stage)) {
    return NextResponse.json({ error: 'Etapa inválida.' }, { status: 400 });
  }
  if (!name || files.length === 0) {
    return NextResponse.json({ error: 'Dê um nome ao anexo e escolha o arquivo.' }, { status: 400 });
  }
  if (files.some((f) => f.size > MAX_SIZE)) {
    return NextResponse.json({ error: 'Cada arquivo deve ter no máximo 15MB.' }, { status: 400 });
  }

  const created = [];
  for (const [index, file] of files.entries()) {
    const ext = file.name.split('.').pop() || 'pdf';
    const path = `crm-deal-${id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: doc, error: insertError } = await supabase
      .from('crm_deal_files')
      .insert({
        deal_id: id,
        stage,
        name: files.length > 1 ? `${name} (${index + 1})` : name,
        file_path: path,
        file_type: file.type,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([path]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Manda uma cópia para o módulo correspondente à etapa (documentos do
    // imóvel, galeria, vistoria etc). Se não der, o motivo fica gravado em
    // synced_error e aparece na tela — o anexo no CRM não se perde.
    const sync = await syncCrmFile(
      supabase,
      {
        id: deal.id,
        title: deal.title,
        property_id: deal.property_id,
        owner_id: deal.owner_id,
        tenant_id: deal.tenant_id,
        guarantor_id: deal.guarantor_id,
        client_id: deal.client_id,
        inspection_id: deal.inspection_id,
      },
      doc,
      user.id
    );

    if (sync.synced_to || sync.synced_error) {
      await supabase
        .from('crm_deal_files')
        .update({
          synced_to: sync.synced_to,
          synced_ref_id: sync.synced_ref_id,
          synced_error: sync.synced_error,
          synced_at: sync.synced_to ? new Date().toISOString() : null,
        })
        .eq('id', doc.id);
    }

    created.push({ ...doc, ...sync });
  }

  return NextResponse.json(created, { status: 201 });
}
