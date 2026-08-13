import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageLeads } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const BUCKET = 'property-documents';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id, fileId } = await params;
  const supabase = createServiceRoleClient();

  const { data: deal } = await supabase.from('crm_deals').select('realtor_id').eq('id', id).maybeSingle();
  if (!deal) return NextResponse.json({ error: 'Captação não encontrada.' }, { status: 404 });
  if (!canManageLeads(user) && deal.realtor_id !== user.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { data: file } = await supabase
    .from('crm_deal_files')
    .select('file_path')
    .eq('id', fileId)
    .eq('deal_id', id)
    .maybeSingle();

  if (!file) return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });

  await supabase.storage.from(BUCKET).remove([file.file_path]);

  const { error } = await supabase.from('crm_deal_files').delete().eq('id', fileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
