import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';
import { permissionsForAccessLevel, type AccessLevel } from '@/lib/auth/permissions';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, phone, role, is_active, created_at')
    .in('role', ['admin', 'realtor'])
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: perms } = await supabase.from('realtor_permissions').select('realtor_id, permission');

  const permsByRealtor = new Map<string, string[]>();
  for (const p of perms ?? []) {
    const list = permsByRealtor.get(p.realtor_id) ?? [];
    list.push(p.permission);
    permsByRealtor.set(p.realtor_id, list);
  }

  const result = (users ?? []).map((u) => ({
    ...u,
    permissions: permsByRealtor.get(u.id) ?? [],
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const phone = body.phone ? String(body.phone).trim() : undefined;
  const accessLevel: AccessLevel = body.accessLevel === 'full' ? 'full' : 'limited';

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
    .insert({ name, email, phone, role: 'realtor', password_hash: passwordHash, is_active: true })
    .select('id, name, email, phone, role, is_active, created_at')
    .single();

  if (userError || !newUser) {
    return NextResponse.json({ error: userError?.message ?? 'Falha ao criar usuário.' }, { status: 500 });
  }

  const { error: realtorError } = await supabase
    .from('realtors')
    .insert({ id: newUser.id, status: 'active' });

  if (realtorError) {
    await supabase.from('users').delete().eq('id', newUser.id);
    return NextResponse.json({ error: realtorError.message }, { status: 500 });
  }

  const permissions = permissionsForAccessLevel(accessLevel);
  const { error: permError } = await supabase
    .from('realtor_permissions')
    .insert(permissions.map((permission) => ({ realtor_id: newUser.id, permission })));

  if (permError) {
    return NextResponse.json({ error: permError.message }, { status: 500 });
  }

  await logAudit({
    user: currentUser,
    action: 'create',
    entityType: 'user',
    entityId: newUser.id,
    description: `Criou o login de corretor "${newUser.name}" (${newUser.email}) com acesso ${accessLevel}.`,
    metadata: { accessLevel },
  });

  return NextResponse.json({ ...newUser, permissions }, { status: 201 });
}
