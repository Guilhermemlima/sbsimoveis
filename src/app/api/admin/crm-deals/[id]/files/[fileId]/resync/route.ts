import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageLeads } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { syncCrmFile } from '@/lib/crm-sync';

// Tenta sincronizar de novo um anexo que falhou (normalmente porque o
// cadastro de destino ainda nao estava vinculado na hora do upload).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id, fileId } = await params;
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

  const { data: file } = await supabase
    .from('crm_deal_files')
    .select('*')
    .eq('id', fileId)
    .eq('deal_id', id)
    .maybeSingle();

  if (!file) return NextResponse.json({ error: 'Anexo não encontrado.' }, { status: 404 });
  if (file.synced_to) {
    return NextResponse.json({ error: 'Este anexo já foi sincronizado.' }, { status: 400 });
  }

  const sync = await syncCrmFile(supabase, deal, file, user.id);

  await supabase
    .from('crm_deal_files')
    .update({
      synced_to: sync.synced_to,
      synced_ref_id: sync.synced_ref_id,
      synced_error: sync.synced_error,
      synced_at: sync.synced_to ? new Date().toISOString() : null,
    })
    .eq('id', fileId);

  if (sync.synced_error) {
    return NextResponse.json({ error: sync.synced_error }, { status: 400 });
  }

  return NextResponse.json({ success: true, synced_to: sync.synced_to });
}
