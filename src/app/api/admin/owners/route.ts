import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessBackOffice } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import type { UserRole } from '@/types';

const isAuthorized = canAccessBackOffice;

function canRead(user: { role: UserRole; permissions?: string[] } | null) {
  if (!user) return false;
  if (['admin', 'finance', 'inspector', 'maintenance_staff', 'legal'].includes(user.role)) return true;
  return canAccessBackOffice(user);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!canRead(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('property_owners')
    .select('*')
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('property_owners')
    .insert({
      name,
      email: body.email || null,
      phone: body.phone || null,
      document_number: body.document_number || null,
      bank_name: body.bank_name || null,
      bank_agency: body.bank_agency || null,
      bank_account: body.bank_account || null,
      pix_key: body.pix_key || null,
      payment_method: body.payment_method || 'pix',
      payment_beneficiary_name: body.payment_beneficiary_name || null,
      preferred_payment_day: body.preferred_payment_day ? Number(body.preferred_payment_day) : null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
