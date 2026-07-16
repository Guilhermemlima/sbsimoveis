import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const BUCKET = 'property-documents';
const MAX_SIZE = 15 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 3600;

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  let propertiesQuery = supabase.from('properties').select('id, title, code').is('deleted_at', null);
  if (!canManageAllProperties(user)) {
    propertiesQuery = propertiesQuery.eq('realtor_id', user.id);
  }
  const { data: properties } = await propertiesQuery;
  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyById = new Map((properties ?? []).map((p) => [p.id, p]));

  if (propertyIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: documents, error } = await supabase
    .from('property_documents')
    .select('*')
    .in('property_id', propertyIds)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.file_path, SIGNED_URL_TTL_SECONDS);
      const property = propertyById.get(doc.property_id);
      return {
        ...doc,
        downloadUrl: signed?.signedUrl ?? null,
        propertyTitle: property?.title ?? 'Imóvel',
        propertyCode: property?.code ?? '',
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const formData = await request.formData();
  const propertyId = String(formData.get('property_id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const file = formData.get('file');

  if (!propertyId || !name || !(file instanceof File)) {
    return NextResponse.json({ error: 'Selecione o imóvel, o nome e o arquivo.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo maior que 15MB.' }, { status: 400 });
  }

  const { data: property } = await supabase
    .from('properties')
    .select('id, realtor_id')
    .eq('id', propertyId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!property) {
    return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  }
  if (!canManageAllProperties(user) && property.realtor_id !== user.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const ext = file.name.split('.').pop() || 'pdf';
  const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: doc, error: insertError } = await supabase
    .from('property_documents')
    .insert({
      property_id: propertyId,
      name,
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

  return NextResponse.json(doc, { status: 201 });
}
