import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessBackOffice } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const BUCKET = 'property-documents';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const user = await getCurrentUser();
  if (!canAccessBackOffice(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id, docId } = await params;
  const supabase = createServiceRoleClient();

  const { data: doc } = await supabase
    .from('owner_documents')
    .select('*')
    .eq('id', docId)
    .eq('owner_id', id)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 });
  }

  await supabase.storage.from(BUCKET).remove([doc.file_path]);

  const { error } = await supabase.from('owner_documents').delete().eq('id', docId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
