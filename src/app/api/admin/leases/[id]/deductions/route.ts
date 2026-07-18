import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, type SessionUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

async function loadLease(supabase: ReturnType<typeof createServiceRoleClient>, id: string, user: SessionUser) {
  const { data: lease } = await supabase
    .from('lease_contracts')
    .select('id, realtor_id')
    .eq('id', id)
    .maybeSingle();

  if (!lease) return { lease: null, forbidden: false };
  if (!canManageAllProperties(user) && lease.realtor_id !== user.id) {
    return { lease: null, forbidden: true };
  }
  return { lease, forbidden: false };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { lease, forbidden } = await loadLease(supabase, id, user!);
  if (forbidden) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  if (!lease) return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });

  const { data, error } = await supabase
    .from('deposit_deductions')
    .select('*')
    .eq('lease_contract_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { lease, forbidden } = await loadLease(supabase, id, user!);
  if (forbidden) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  if (!lease) return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });

  const body = await request.json();
  if (!body.description || !body.amount) {
    return NextResponse.json({ error: 'Informe descrição e valor da dedução.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('deposit_deductions')
    .insert({
      lease_contract_id: id,
      description: body.description,
      amount: Number(body.amount),
      created_by: user!.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
