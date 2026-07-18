import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

function isAuthorized(user: { role: string } | null) {
  return !!user && (user.role === 'admin' || user.role === 'realtor');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: payout } = await supabase
    .from('owner_payouts')
    .select('id, property_id')
    .eq('id', id)
    .maybeSingle();

  if (!payout) {
    return NextResponse.json({ error: 'Repasse não encontrado.' }, { status: 404 });
  }

  if (!canManageAllProperties(user!)) {
    const { data: property } = await supabase
      .from('properties')
      .select('realtor_id')
      .eq('id', payout.property_id)
      .maybeSingle();
    if (!property || property.realtor_id !== user!.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status === 'paid') {
    updates.status = 'paid';
    updates.paid_date = body.paid_date || new Date().toISOString().slice(0, 10);
    updates.payment_method = body.payment_method || 'pix';
  } else if (body.status) {
    updates.status = body.status;
  }

  const { data, error } = await supabase
    .from('owner_payouts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
