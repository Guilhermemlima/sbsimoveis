import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessBackOffice } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const isAuthorized = canAccessBackOffice;

export async function GET() {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('guarantors')
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
    .from('guarantors')
    .insert({
      name,
      document_number: body.document_number || null,
      rg: body.rg || null,
      address: body.address || null,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
