import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessBackOffice } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const BUCKET = 'property-documents';
const MAX_SIZE = 15 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canAccessBackOffice(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: documents, error } = await supabase
    .from('tenant_documents')
    .select('*')
    .eq('tenant_id', id)
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
  if (!canAccessBackOffice(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: tenant } = await supabase.from('tenants').select('id').eq('id', id).maybeSingle();
  if (!tenant) {
    return NextResponse.json({ error: 'Inquilino não encontrado.' }, { status: 404 });
  }

  const formData = await request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const files = formData.getAll('file').filter((f): f is File => f instanceof File);

  if (!name || files.length === 0) {
    return NextResponse.json({ error: 'Dê um nome ao documento e escolha o arquivo.' }, { status: 400 });
  }
  if (files.some((f) => f.size > MAX_SIZE)) {
    return NextResponse.json({ error: 'Cada arquivo deve ter no máximo 15MB.' }, { status: 400 });
  }

  const created = [];
  for (const [index, file] of files.entries()) {
    const ext = file.name.split('.').pop() || 'pdf';
    const path = `tenant-${id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: doc, error: insertError } = await supabase
      .from('tenant_documents')
      .insert({
        tenant_id: id,
        name: files.length > 1 ? `${name} (${index + 1})` : name,
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

    created.push(doc);
  }

  return NextResponse.json(created, { status: 201 });
}
