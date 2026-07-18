import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';
import { permissionsForAccessLevel, type AccessLevel } from '@/lib/auth/permissions';
import { logAudit } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;

  if (id === currentUser.id) {
    return NextResponse.json(
      { error: 'Você não pode alterar o próprio acesso por aqui.' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const supabase = createServiceRoleClient();

  const { data: targetUser } = await supabase.from('users').select('name, email').eq('id', id).maybeSingle();
  const targetLabel = targetUser ? `${targetUser.name} (${targetUser.email})` : id;

  if (typeof body.is_active === 'boolean') {
    const { error } = await supabase
      .from('users')
      .update({ is_active: body.is_active })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAudit({
      user: currentUser,
      action: body.is_active ? 'activate' : 'deactivate',
      entityType: 'user',
      entityId: id,
      description: `${body.is_active ? 'Reativou' : 'Desativou'} o login de "${targetLabel}".`,
    });
  }

  if (body.accessLevel === 'full' || body.accessLevel === 'limited') {
    const accessLevel: AccessLevel = body.accessLevel;
    await supabase.from('realtor_permissions').delete().eq('realtor_id', id);
    const permissions = permissionsForAccessLevel(accessLevel);
    const { error } = await supabase
      .from('realtor_permissions')
      .insert(permissions.map((permission) => ({ realtor_id: id, permission })));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAudit({
      user: currentUser,
      action: 'permission_change',
      entityType: 'user',
      entityId: id,
      description: `Alterou o nível de acesso de "${targetLabel}" para ${accessLevel === 'full' ? 'Completo' : 'Limitado'}.`,
      metadata: { accessLevel },
    });
  }

  return NextResponse.json({ success: true });
}
