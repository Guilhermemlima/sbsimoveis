import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessInspections } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

const isAuthorized = canAccessInspections;

const BUCKET = 'property-documents';
const MAX_SIZE = 15 * 1024 * 1024;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: inspection } = await supabase
    .from('inspections')
    .select('id, is_locked')
    .eq('id', id)
    .maybeSingle();

  if (!inspection) return NextResponse.json({ error: 'Vistoria não encontrada.' }, { status: 404 });
  if (inspection.is_locked) {
    return NextResponse.json({ error: 'Vistoria concluída não pode mais ser alterada.' }, { status: 409 });
  }

  const formData = await request.formData();
  const environmentId = formData.get('environment_id');
  const itemId = formData.get('item_id');
  const fileType = String(formData.get('file_type') ?? 'photo');
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Selecione um arquivo.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo maior que 15MB.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `inspections/${id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: media, error } = await supabase
    .from('inspection_media')
    .insert({
      inspection_id: id,
      environment_id: environmentId ? String(environmentId) : null,
      item_id: itemId ? String(itemId) : null,
      file_path: path,
      file_type: fileType,
      uploaded_by: user!.id,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);

  await logAudit({
    user: user!,
    action: 'update',
    entityType: 'inspection',
    entityId: id,
    description: `Anexou uma foto à vistoria.`,
  });

  return NextResponse.json({ ...media, url: signed?.signedUrl ?? null }, { status: 201 });
}
