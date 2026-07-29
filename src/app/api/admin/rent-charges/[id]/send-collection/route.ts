import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessFinance, hasFullPropertyAccess } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { sendOverdueCollectionEmail } from '@/lib/rent-charge-emails';

// Mesmo padrão de multa/juros usado em /api/admin/rent-charges/overdue.
const LATE_FEE_RATE = 0.02;
const LATE_INTEREST_RATE_MONTHLY = 0.01;

function daysLate(dueDate: string): number {
  const due = new Date(dueDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canAccessFinance(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: charge } = await supabase
    .from('financial_transactions')
    .select('id, description, amount, due_date, tenant_id, property_id, status')
    .eq('id', id)
    .maybeSingle();

  if (!charge) {
    return NextResponse.json({ error: 'Cobrança não encontrada.' }, { status: 404 });
  }

  if (!hasFullPropertyAccess(user!)) {
    const { data: property } = await supabase
      .from('properties')
      .select('realtor_id')
      .eq('id', charge.property_id)
      .maybeSingle();
    if (!property || property.realtor_id !== user!.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }
  }

  if (!charge.tenant_id) {
    return NextResponse.json({ error: 'Cobrança sem inquilino vinculado.' }, { status: 400 });
  }
  if (charge.status !== 'pending') {
    return NextResponse.json({ error: 'Esta cobrança não está pendente.' }, { status: 400 });
  }

  const [{ data: tenant }, { data: property }] = await Promise.all([
    supabase.from('tenants').select('name, email').eq('id', charge.tenant_id).maybeSingle(),
    supabase.from('properties').select('title, code').eq('id', charge.property_id).maybeSingle(),
  ]);

  if (!tenant?.email || !property) {
    return NextResponse.json({ error: 'Inquilino sem e-mail cadastrado.' }, { status: 400 });
  }

  const late = daysLate(charge.due_date);
  const amount = Number(charge.amount);
  const lateFee = Number((amount * LATE_FEE_RATE).toFixed(2));
  const interest = Number((amount * LATE_INTEREST_RATE_MONTHLY * (late / 30)).toFixed(2));

  const result = await sendOverdueCollectionEmail({
    tenantName: tenant.name,
    tenantEmail: tenant.email,
    propertyTitle: property.title,
    propertyCode: property.code,
    description: charge.description,
    amount,
    dueDate: charge.due_date,
    daysLate: late,
    lateFee,
    interest,
    total: Number((amount + lateFee + interest).toFixed(2)),
  });

  if (!result.sent) {
    return NextResponse.json({ error: result.error || 'Não foi possível enviar a cobrança.' }, { status: 500 });
  }

  await logAudit({
    user: user!,
    action: 'send_collection',
    entityType: 'rent_charge',
    entityId: id,
    description: `Enviou cobrança em atraso por e-mail para ${tenant.name}.`,
  });

  return NextResponse.json({ sent: true });
}
