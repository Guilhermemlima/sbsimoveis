import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const BUCKET = 'property-images';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id, imageId } = await params;
  const supabase = createServiceRoleClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id, realtor_id')
    .eq('id', id)
    .maybeSingle();

  if (!property) {
    return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  }
  if (!canManageAllProperties(user) && property.realtor_id !== user.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { data: image } = await supabase
    .from('property_images')
    .select('*')
    .eq('id', imageId)
    .eq('property_id', id)
    .maybeSingle();

  if (!image) {
    return NextResponse.json({ error: 'Imagem não encontrada.' }, { status: 404 });
  }

  const marker = `/object/public/${BUCKET}/`;
  const markerIndex = image.image_url.indexOf(marker);
  if (markerIndex !== -1) {
    const path = image.image_url.slice(markerIndex + marker.length);
    await supabase.storage.from(BUCKET).remove([path]);
  }

  await supabase.from('property_images').delete().eq('id', imageId);

  return NextResponse.json({ success: true });
}
