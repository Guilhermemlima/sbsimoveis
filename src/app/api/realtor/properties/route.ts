import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { recordSaleForProperty } from '@/lib/sales';
import { isValidYouTubeUrl } from '@/lib/youtube';

const SOLD_STATUSES = ['sold', 'rented'];

const REQUIRED_FIELDS = [
  'title',
  'code',
  'type',
  'purpose',
  'value',
  'address',
  'city',
  'neighborhood',
  'total_area',
  'built_area',
];

const READ_ONLY_ROLES = ['finance', 'inspector', 'maintenance_staff'];

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin' && !READ_ONLY_ROLES.includes(user.role))) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  let query = supabase
    .from('properties')
    .select('*, property_images(id, image_url, is_main, order)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (user.role === 'realtor' && !canManageAllProperties(user)) {
    query = query.eq('realtor_id', user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();

  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === '') {
      return NextResponse.json({ error: `Campo obrigatório faltando: ${field}` }, { status: 400 });
    }
  }

  if (body.video_url && !isValidYouTubeUrl(body.video_url)) {
    return NextResponse.json(
      { error: 'O vídeo do imóvel deve ser um link válido do YouTube.' },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  let realtorId = user.id;
  if (canManageAllProperties(user) && body.realtor_id) {
    realtorId = body.realtor_id;
  }

  const { data: realtorRow } = await supabase
    .from('realtors')
    .select('id')
    .eq('id', realtorId)
    .maybeSingle();

  if (!realtorRow) {
    return NextResponse.json({ error: 'Corretor responsável inválido.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      realtor_id: realtorId,
      title: body.title,
      code: body.code,
      type: body.type,
      purpose: body.purpose,
      value: body.value,
      address: body.address,
      city: body.city,
      neighborhood: body.neighborhood,
      total_area: body.total_area,
      built_area: body.built_area,
      bedrooms: body.bedrooms ?? 0,
      bathrooms: body.bathrooms ?? 0,
      parking_spaces: body.parking_spaces ?? 0,
      description: body.description ?? '',
      amenities: body.amenities ?? [],
      status: body.status ?? 'available',
      is_opportunity: !!body.is_opportunity,
      is_featured: !!body.is_featured,
      is_exclusive: !!body.is_exclusive,
      commission_rate: Number(body.commission_rate) || 0,
      video_url: body.video_url || null,
    })
    .select()
    .single();

  if (error) {
    const message = error.code === '23505' ? 'Já existe um imóvel com esse código.' : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (SOLD_STATUSES.includes(data.status) && body.record_sale) {
    await recordSaleForProperty({
      supabase,
      propertyId: data.id,
      realtorId: body.sale_realtor_id || data.realtor_id,
      saleValue: Number(body.sale_value) || Number(data.value),
      commissionRate: Number(data.commission_rate) || 0,
      purpose: data.purpose,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
