import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessBackOffice } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canAccessBackOffice(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const password = String(body.password ?? '');

  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha precisa ter pelo menos 6 caracteres.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, user_id, name, email, phone')
    .eq('id', id)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: 'Inquilino não encontrado.' }, { status: 404 });
  }
  if (tenant.user_id) {
    return NextResponse.json({ error: 'Este inquilino já tem um login.' }, { status: 409 });
  }
  if (!tenant.email) {
    return NextResponse.json({ error: 'Cadastre um e-mail para este inquilino antes de criar o login.' }, { status: 400 });
  }

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', tenant.email)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: 'Já existe um usuário com esse e-mail.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      role: 'tenant',
      password_hash: passwordHash,
      is_active: true,
    })
    .select('id, name, email')
    .single();

  if (userError || !newUser) {
    return NextResponse.json({ error: userError?.message ?? 'Falha ao criar login.' }, { status: 500 });
  }

  const { error: linkError } = await supabase
    .from('tenants')
    .update({ user_id: newUser.id })
    .eq('id', id);

  if (linkError) {
    await supabase.from('users').delete().eq('id', newUser.id);
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  await logAudit({
    user: user!,
    action: 'create',
    entityType: 'user',
    entityId: newUser.id,
    description: `Criou o login do portal para o inquilino "${newUser.name}" (${newUser.email}).`,
  });

  return NextResponse.json({ success: true, user: newUser });
}
