import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageLeads } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { syncCrmFile } from '@/lib/crm-sync';

// Cria um cadastro real (proprietario, inquilino ou fiador) a partir dos
// dados digitados na captacao, vincula ao CRM e reprocessa os anexos que
// estavam pendentes por falta desse vinculo.

type RecordType = 'owner' | 'tenant' | 'guarantor';

const CONFIG: Record<RecordType, { table: string; column: string; label: string }> = {
  owner: { table: 'property_owners', column: 'owner_id', label: 'proprietário' },
  tenant: { table: 'tenants', column: 'tenant_id', label: 'inquilino' },
  guarantor: { table: 'guarantors', column: 'guarantor_id', label: 'fiador' },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: deal } = await supabase
    .from('crm_deals')
    .select(
      'id, realtor_id, title, property_id, owner_id, tenant_id, guarantor_id, client_id, inspection_id'
    )
    .eq('id', id)
    .maybeSingle();

  if (!deal) return NextResponse.json({ error: 'Captação não encontrada.' }, { status: 404 });
  if (!canManageLeads(user) && deal.realtor_id !== user.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const type = body.type as RecordType;
  const cfg = CONFIG[type];
  if (!cfg) {
    return NextResponse.json({ error: 'Tipo de cadastro inválido.' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Informe o nome para cadastrar.' }, { status: 400 });
  }

  if (deal[cfg.column as keyof typeof deal]) {
    return NextResponse.json(
      { error: `Esta captação já tem um ${cfg.label} vinculado.` },
      { status: 400 }
    );
  }

  const { data: created, error } = await supabase
    .from(cfg.table)
    .insert({
      name,
      email: body.email || null,
      phone: body.phone || null,
      document_number: body.document_number || null,
    })
    .select('id, name')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase
    .from('crm_deals')
    .update({ [cfg.column]: created.id, updated_at: new Date().toISOString() })
    .eq('id', id);

  await logAudit({
    user,
    action: 'create',
    entityType: type === 'owner' ? 'property_owner' : type,
    entityId: created.id,
    description: `Cadastrou o ${cfg.label} "${name}" a partir da captação "${deal.title}".`,
  });

  // Agora que o cadastro existe, tenta enviar os anexos que ficaram pendentes.
  const { data: pendentes } = await supabase
    .from('crm_deal_files')
    .select('*')
    .eq('deal_id', id)
    .is('synced_to', null);

  const dealAtualizado = { ...deal, [cfg.column]: created.id };
  let sincronizados = 0;

  for (const file of pendentes ?? []) {
    const sync = await syncCrmFile(supabase, dealAtualizado, file, user.id);
    if (sync.synced_to || sync.synced_error) {
      await supabase
        .from('crm_deal_files')
        .update({
          synced_to: sync.synced_to,
          synced_ref_id: sync.synced_ref_id,
          synced_error: sync.synced_error,
          synced_at: sync.synced_to ? new Date().toISOString() : null,
        })
        .eq('id', file.id);
    }
    if (sync.synced_to) sincronizados += 1;
  }

  return NextResponse.json(
    { success: true, id: created.id, name: created.name, anexosSincronizados: sincronizados },
    { status: 201 }
  );
}
