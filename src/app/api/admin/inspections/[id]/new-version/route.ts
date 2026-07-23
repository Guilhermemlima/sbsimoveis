import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: original } = await supabase.from('inspections').select('*').eq('id', id).maybeSingle();
  if (!original) {
    return NextResponse.json({ error: 'Vistoria não encontrada.' }, { status: 404 });
  }
  if (!original.is_locked) {
    return NextResponse.json(
      { error: 'Somente uma vistoria concluída e assinada pode gerar uma nova versão.' },
      { status: 409 }
    );
  }
  if (original.superseded_by) {
    return NextResponse.json(
      { error: 'Esta vistoria já possui uma versão mais recente.' },
      { status: 409 }
    );
  }

  const { data: newInspection, error: insertError } = await supabase
    .from('inspections')
    .insert({
      property_id: original.property_id,
      lease_contract_id: original.lease_contract_id,
      owner_id: original.owner_id,
      tenant_id: original.tenant_id,
      type: original.type,
      custom_type_label: original.custom_type_label,
      status: 'pending',
      notes: original.notes,
      version: (original.version ?? 1) + 1,
      created_by: user!.id,
    })
    .select()
    .single();

  if (insertError || !newInspection) {
    return NextResponse.json({ error: insertError?.message ?? 'Erro ao criar nova versão.' }, { status: 400 });
  }

  const { data: originalEnvironments } = await supabase
    .from('inspection_environments')
    .select('*')
    .eq('inspection_id', id)
    .order('order_index', { ascending: true });

  for (const env of originalEnvironments ?? []) {
    const { data: newEnv, error: envError } = await supabase
      .from('inspection_environments')
      .insert({ inspection_id: newInspection.id, name: env.name, order_index: env.order_index })
      .select()
      .single();
    if (envError || !newEnv) continue;

    const { data: originalItems } = await supabase
      .from('inspection_items')
      .select('*')
      .eq('environment_id', env.id);

    if (originalItems?.length) {
      await supabase.from('inspection_items').insert(
        originalItems.map((item) => ({
          environment_id: newEnv.id,
          item_type: item.item_type,
          rating: item.rating,
          comments: item.comments,
          pre_existing_damage: item.pre_existing_damage,
          damage_during_lease: item.damage_during_lease,
        }))
      );
    }
  }

  await supabase.from('inspections').update({ superseded_by: newInspection.id }).eq('id', id);

  await logAudit({
    user: user!,
    action: 'create',
    entityType: 'inspection',
    entityId: newInspection.id,
    description: `Criou a versão ${newInspection.version} da vistoria, substituindo a versão ${original.version}.`,
  });

  return NextResponse.json(newInspection, { status: 201 });
}
