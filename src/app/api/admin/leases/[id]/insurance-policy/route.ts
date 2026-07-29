import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties, canAccessBackOffice } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const BUCKET = 'property-documents';
const MAX_SIZE = 15 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 3600;

const isAuthorized = canAccessBackOffice;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: lease } = await supabase
    .from('lease_contracts')
    .select('id, realtor_id, fiance_insurance_file_path')
    .eq('id', id)
    .maybeSingle();

  if (!lease) {
    return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
  }
  if (!canManageAllProperties(user!) && lease.realtor_id !== user!.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Escolha o arquivo da apólice.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo maior que 15MB.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'pdf';
  const path = `lease-${id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const previousPath = lease.fiance_insurance_file_path;

  const { data, error } = await supabase
    .from('lease_contracts')
    .update({
      fiance_insurance_file_path: path,
      fiance_insurance_file_name: file.name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (previousPath) {
    await supabase.storage.from(BUCKET).remove([previousPath]);
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: lease } = await supabase
    .from('lease_contracts')
    .select('fiance_insurance_file_path, fiance_insurance_file_name')
    .eq('id', id)
    .maybeSingle();

  if (!lease?.fiance_insurance_file_path) {
    return NextResponse.json({ downloadUrl: null, fileName: null });
  }

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(lease.fiance_insurance_file_path, SIGNED_URL_TTL_SECONDS);

  return NextResponse.json({
    downloadUrl: signed?.signedUrl ?? null,
    fileName: lease.fiance_insurance_file_name,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: lease } = await supabase
    .from('lease_contracts')
    .select('fiance_insurance_file_path, realtor_id')
    .eq('id', id)
    .maybeSingle();

  if (!lease) {
    return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
  }
  if (!canManageAllProperties(user!) && lease.realtor_id !== user!.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  if (lease.fiance_insurance_file_path) {
    await supabase.storage.from(BUCKET).remove([lease.fiance_insurance_file_path]);
  }

  const { error } = await supabase
    .from('lease_contracts')
    .update({
      fiance_insurance_file_path: null,
      fiance_insurance_file_name: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
