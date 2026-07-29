import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessLegal } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const BUCKET = 'property-documents';
const MAX_SIZE = 15 * 1024 * 1024;
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

  const { data: documents, error } = await supabase
    .from('legal_case_documents')
    .select('*')
    .eq('legal_case_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.file_path, SIGNED_URL_TTL_SECONDS);
      return { ...doc, downloadUrl: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canAccessLegal(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: legalCase } = await supabase.from('legal_cases').select('id').eq('id', id).maybeSingle();
  if (!legalCase) {
    return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 });
  }

  const formData = await request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const file = formData.get('file');

  if (!name || !(file instanceof File)) {
    return NextResponse.json({ error: 'Dê um nome ao documento e escolha o arquivo.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo maior que 15MB.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'pdf';
  const path = `legal-case-${id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: doc, error: insertError } = await supabase
    .from('legal_case_documents')
    .insert({
      legal_case_id: id,
      name,
      file_path: path,
      file_type: file.type,
      uploaded_by: user!.id,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(doc, { status: 201 });
}
