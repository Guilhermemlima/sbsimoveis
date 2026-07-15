import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const BUCKET = 'property-images';
const MAX_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id, realtor_id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!property) {
    return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  }
  if (!canManageAllProperties(user) && property.realtor_id !== user.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG ou WebP.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo maior que 8MB.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { count } = await supabase
    .from('property_images')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', id);

  const { data: image, error: insertError } = await supabase
    .from('property_images')
    .insert({
      property_id: id,
      image_url: publicUrlData.publicUrl,
      is_main: (count ?? 0) === 0,
      order: count ?? 0,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(image, { status: 201 });
}
