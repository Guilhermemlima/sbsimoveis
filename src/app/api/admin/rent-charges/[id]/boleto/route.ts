import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessFinance, hasFullPropertyAccess } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const BUCKET = 'property-documents';
const MAX_SIZE = 15 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 3600;

const isAuthorized = canAccessFinance;

async function loadOwnedCharge(id: string, userId: string, fullAccess: boolean) {
  const supabase = createServiceRoleClient();
  const { data: charge } = await supabase
    .from('financial_transactions')
    .select('id, property_id, boleto_file_path')
    .eq('id', id)
    .maybeSingle();

  if (!charge) return { charge: null, supabase };

  if (!fullAccess) {
    const { data: property } = await supabase
      .from('properties')
      .select('realtor_id')
      .eq('id', charge.property_id)
      .maybeSingle();
    if (!property || property.realtor_id !== userId) return { charge: null, supabase };
  }

  return { charge, supabase };
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

  const { data: charge } = await supabase
    .from('financial_transactions')
    .select('boleto_file_path, boleto_file_name')
    .eq('id', id)
    .maybeSingle();

  if (!charge?.boleto_file_path) {
    return NextResponse.json({ downloadUrl: null, fileName: null });
  }

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(charge.boleto_file_path, SIGNED_URL_TTL_SECONDS);

  return NextResponse.json({
    downloadUrl: signed?.signedUrl ?? null,
    fileName: charge.boleto_file_name,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const { charge, supabase } = await loadOwnedCharge(id, user!.id, hasFullPropertyAccess(user!));

  if (!charge) {
    return NextResponse.json({ error: 'Cobrança não encontrada.' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Escolha o arquivo do boleto.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo maior que 15MB.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'pdf';
  const path = `rent-charge-${id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const previousPath = charge.boleto_file_path;

  const { error } = await supabase
    .from('financial_transactions')
    .update({
      boleto_file_path: path,
      boleto_file_name: file.name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (previousPath) {
    await supabase.storage.from(BUCKET).remove([previousPath]);
  }

  return NextResponse.json({ success: true, fileName: file.name }, { status: 201 });
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
  const { charge, supabase } = await loadOwnedCharge(id, user!.id, hasFullPropertyAccess(user!));

  if (!charge) {
    return NextResponse.json({ error: 'Cobrança não encontrada.' }, { status: 404 });
  }

  if (charge.boleto_file_path) {
    await supabase.storage.from(BUCKET).remove([charge.boleto_file_path]);
  }

  const { error } = await supabase
    .from('financial_transactions')
    .update({
      boleto_file_path: null,
      boleto_file_name: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
