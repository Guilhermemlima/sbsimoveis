import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, type SessionUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { recordSaleForProperty } from '@/lib/sales';

const UPDATABLE_FIELDS = [
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
  'bedrooms',
  'bathrooms',
  'parking_spaces',
  'description',
  'amenities',
  'status',
  'is_opportunity',
  'is_featured',
  'is_exclusive',
  'commission_rate',
];

const SOLD_STATUSES = ['sold', 'rented'];

async function loadOwnedProperty(id: string, user: SessionUser) {
  const supabase = createServiceRoleClient();
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!property) return { property: null, supabase };
  if (!canManageAllProperties(user) && property.realtor_id !== user.id) {
    return { property: null, supabase };
  }
  return { property, supabase };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const { property, supabase } = await loadOwnedProperty(id, user);
  if (!property) {
    return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  }

  const { data: images } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', id)
    .order('order', { ascending: true });

  return NextResponse.json({ ...property, images: images ?? [] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const { property, supabase } = await loadOwnedProperty(id, user);
  if (!property) {
    return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    const message = error.code === '23505' ? 'Já existe um imóvel com esse código.' : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const enteringSold = SOLD_STATUSES.includes(data.status) && !SOLD_STATUSES.includes(property.status);
  if (enteringSold && body.record_sale) {
    const { error: saleError } = await recordSaleForProperty({
      supabase,
      propertyId: data.id,
      realtorId: body.sale_realtor_id || data.realtor_id,
      saleValue: Number(body.sale_value) || Number(data.value),
      commissionRate: Number(data.commission_rate) || 0,
      purpose: data.purpose,
    });
    if (saleError) {
      return NextResponse.json(
        { ...data, saleWarning: 'Imóvel atualizado, mas não foi possível registrar a venda: ' + saleError.message },
      );
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const { property, supabase } = await loadOwnedProperty(id, user);
  if (!property) {
    return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  }

  const { error } = await supabase
    .from('properties')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
