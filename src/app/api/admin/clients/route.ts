import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone, is_active, created_at')
    .eq('role', 'client')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const phone = body.phone ? String(body.phone).trim() : undefined;

  if (!name || !email || password.length < 6) {
    return NextResponse.json(
      { error: 'Nome, e-mail e senha (mín. 6 caracteres) são obrigatórios.' },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Já existe um usuário com esse e-mail.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({ name, email, phone, role: 'client', password_hash: passwordHash, is_active: true })
    .select('id, name, email, phone, is_active, created_at')
    .single();

  if (userError || !newUser) {
    return NextResponse.json({ error: userError?.message ?? 'Falha ao criar cliente.' }, { status: 500 });
  }

  const { error: clientError } = await supabase.from('clients').insert({ id: newUser.id });

  if (clientError) {
    await supabase.from('users').delete().eq('id', newUser.id);
    return NextResponse.json({ error: clientError.message }, { status: 500 });
  }

  return NextResponse.json(newUser, { status: 201 });
}
