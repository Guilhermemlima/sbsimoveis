import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessInspections } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

const isAuthorized = canAccessInspections;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: inspection } = await supabase
    .from('inspections')
    .select('id, is_locked')
    .eq('id', id)
    .maybeSingle();

  if (!inspection) return NextResponse.json({ error: 'Vistoria não encontrada.' }, { status: 404 });
  if (inspection.is_locked) {
    return NextResponse.json({ error: 'Esta vistoria já foi concluída.' }, { status: 409 });
  }

  const body = await request.json();
  const inspectorName = String(body.inspectorSignatureName ?? '').trim();

  if (!inspectorName) {
    return NextResponse.json(
      { error: 'A assinatura do vistoriador é obrigatória para concluir a vistoria.' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    inspector_signature_name: inspectorName,
    inspector_signed_at: now,
    status: 'completed',
    is_locked: true,
    performed_date: body.performedDate || new Date().toISOString().slice(0, 10),
    final_report: body.finalReport || null,
    updated_at: now,
  };

  const tenantName = String(body.tenantSignatureName ?? '').trim();
  if (tenantName) {
    updates.tenant_signature_name = tenantName;
    updates.tenant_signed_at = now;
  }

  const ownerName = String(body.ownerSignatureName ?? '').trim();
  if (ownerName) {
    updates.owner_signature_name = ownerName;
    updates.owner_signed_at = now;
  }

  const { data, error } = await supabase.from('inspections').update(updates).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit({
    user: user!,
    action: 'sign',
    entityType: 'inspection',
    entityId: id,
    description: `Concluiu e assinou a vistoria (vistoriador: ${inspectorName}). O laudo agora está bloqueado para edição.`,
  });

  return NextResponse.json(data);
}
