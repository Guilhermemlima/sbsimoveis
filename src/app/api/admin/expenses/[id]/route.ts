import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';

function isAdmin(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('financial_transactions')
    .select('id, type')
    .eq('id', id)
    .maybeSingle();

  if (!existing || existing.type !== 'expense') {
    return NextResponse.json({ error: 'Despesa não encontrada.' }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status === 'paid') {
    updates.status = 'paid';
    updates.paid_date = body.paid_date || new Date().toISOString().slice(0, 10);
    updates.payment_method = body.payment_method || 'manual';
  } else if (body.status) {
    updates.status = body.status;
  }

  const { data, error } = await supabase
    .from('financial_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
