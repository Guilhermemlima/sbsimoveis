import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
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

  const { data: lease } = await supabase
    .from('lease_contracts')
    .select('id, realtor_id, deposit_value, deposit_status')
    .eq('id', id)
    .maybeSingle();

  if (!lease) {
    return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
  }
  if (!canManageAllProperties(user!) && lease.realtor_id !== user!.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }
  if (lease.deposit_status === 'refunded' || lease.deposit_status === 'forfeited') {
    return NextResponse.json({ error: 'A caução deste contrato já foi encerrada.' }, { status: 409 });
  }

  const { data: deductions } = await supabase
    .from('deposit_deductions')
    .select('amount')
    .eq('lease_contract_id', id);

  const totalDeductions = (deductions ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
  const depositValue = Number(lease.deposit_value);
  const refundAmount = Math.max(depositValue - totalDeductions, 0);

  const newStatus =
    refundAmount <= 0 ? 'forfeited' : refundAmount < depositValue ? 'partially_refunded' : 'refunded';

  const { data, error } = await supabase
    .from('lease_contracts')
    .update({
      deposit_status: newStatus,
      deposit_returned_date: new Date().toISOString().slice(0, 10),
      deposit_returned_amount: refundAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit({
    user: user!,
    action: 'settle_deposit',
    entityType: 'lease_contract',
    entityId: id,
    description: `Finalizou a devolução da caução: R$ ${refundAmount.toFixed(2)} devolvido (R$ ${totalDeductions.toFixed(2)} em deduções).`,
    metadata: { depositValue, totalDeductions, refundAmount },
  });

  return NextResponse.json({ ...data, totalDeductions, refundAmount });
}
