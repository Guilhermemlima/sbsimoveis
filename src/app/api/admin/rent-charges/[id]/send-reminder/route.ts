import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessFinance, hasFullPropertyAccess } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { sendDueReminderEmail } from '@/lib/rent-charge-emails';

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

  const [{ data: tenant }, { data: property }] = await Promise.all([
    supabase.from('tenants').select('name, email').eq('id', charge.tenant_id).maybeSingle(),
    supabase.from('properties').select('title, code').eq('id', charge.property_id).maybeSingle(),
  ]);

  if (!tenant?.email || !property) {
    return NextResponse.json({ error: 'Inquilino sem e-mail cadastrado.' }, { status: 400 });
  }

  const result = await sendDueReminderEmail({
    tenantName: tenant.name,
    tenantEmail: tenant.email,
    propertyTitle: property.title,
    propertyCode: property.code,
    description: charge.description,
    amount: Number(charge.amount),
    dueDate: charge.due_date,
  });

  if (!result.sent) {
    return NextResponse.json({ error: result.error || 'Não foi possível enviar o lembrete.' }, { status: 500 });
  }

  await logAudit({
    user: user!,
    action: 'send_reminder',
    entityType: 'rent_charge',
    entityId: id,
    description: `Enviou lembrete de vencimento por e-mail para ${tenant.name}.`,
  });

  return NextResponse.json({ sent: true });
}
