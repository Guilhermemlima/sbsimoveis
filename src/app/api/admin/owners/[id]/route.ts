import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessBackOffice } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const UPDATABLE_FIELDS = [
  'name',
  'email',
  'phone',
  'document_number',
  'rg',
  'address',
  'bank_name',
  'bank_agency',
  'bank_account',
  'pix_key',
  'payment_method',
  'payment_beneficiary_name',
  'preferred_payment_day',
  'notes',
];

const isAuthorized = canAccessBackOffice;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from('property_owners').select('*').eq('id', id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Proprietário não encontrado.' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (body[key] === undefined) continue;
    if (key === 'preferred_payment_day') {
      updates[key] = body[key] === '' || body[key] === null ? null : Number(body[key]);
    } else {
      updates[key] = body[key];
    }
  }
  updates.updated_at = new Date().toISOString();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('property_owners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { count } = await supabase
    .from('lease_contracts')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'Não é possível remover: este proprietário tem contratos vinculados.' },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('property_owners').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
