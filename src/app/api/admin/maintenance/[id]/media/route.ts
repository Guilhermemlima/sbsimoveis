import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessMaintenance } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

const isAuthorized = canAccessMaintenance;

const BUCKET = 'property-documents';
const MAX_SIZE = 15 * 1024 * 1024;
const LOCKED_STATUSES = ['completed', 'cancelled'];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: maintenanceRequest } = await supabase
    .from('maintenance_requests')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (!maintenanceRequest) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
  if (LOCKED_STATUSES.includes(maintenanceRequest.status)) {
    return NextResponse.json(
      { error: 'Esta solicitação já foi concluída ou cancelada e não pode mais ser alterada.' },
      { status: 409 }
    );
  }

  const formData = await request.formData();
  const fileType = String(formData.get('file_type') ?? 'photo');
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Selecione um arquivo.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo maior que 15MB.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `maintenance/${id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: media, error } = await supabase
    .from('maintenance_media')
    .insert({
      maintenance_request_id: id,
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
    entityType: 'maintenance_request',
    entityId: id,
    description: `Anexou uma foto à solicitação de manutenção.`,
  });

  return NextResponse.json({ ...media, url: signed?.signedUrl ?? null }, { status: 201 });
}
