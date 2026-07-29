import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessFinance } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { sendBoletoEmail } from '@/lib/rent-charge-emails';

function monthLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function clampDueDate(year: number, month: number, day: number): string {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, lastDayOfMonth);
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(safeDay).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export async function POST() {
  const user = await getCurrentUser();
  if (!canAccessFinance(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const { data: category } = await supabase
    .from('financial_categories')
    .select('id')
    .eq('name', 'Aluguel Recebido')
    .eq('center', 'rental')
    .maybeSingle();

  if (!category) {
    return NextResponse.json(
      { error: 'Categoria "Aluguel Recebido" não encontrada. Rode a semeadura de categorias primeiro.' },
      { status: 400 }
    );
  }

  const { data: activeLeases } = await supabase
    .from('lease_contracts')
    .select('id, property_id, owner_id, tenant_id, rent_value, due_day')
    .eq('status', 'active');

  if (!activeLeases || activeLeases.length === 0) {
    return NextResponse.json({ generated: 0, skipped: 0, message: 'Nenhum contrato ativo.' });
  }

  const now = new Date();
  const competenceDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

  let generated = 0;
  let skipped = 0;
  let emailsSent = 0;

  for (const lease of activeLeases) {
    const { count } = await supabase
      .from('financial_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('lease_contract_id', lease.id)
      .eq('category_id', category.id)
      .gte('competence_date', monthStart)
      .lt('competence_date', monthEnd);

    if (count && count > 0) {
      skipped += 1;
      continue;
    }

    const dueDate = clampDueDate(now.getFullYear(), now.getMonth(), lease.due_day);

    const description = `Aluguel — ${monthLabel(now)}`;

    const { error } = await supabase.from('financial_transactions').insert({
      type: 'revenue',
      center: 'rental',
      category_id: category.id,
      property_id: lease.property_id,
      lease_contract_id: lease.id,
      owner_id: lease.owner_id,
      tenant_id: lease.tenant_id,
      created_by: user!.id,
      description,
      amount: lease.rent_value,
      competence_date: competenceDate,
      due_date: dueDate,
      status: 'pending',
    });

    if (!error) {
      generated += 1;

      if (lease.tenant_id) {
        const [{ data: tenant }, { data: property }] = await Promise.all([
          supabase.from('tenants').select('name, email').eq('id', lease.tenant_id).maybeSingle(),
          supabase.from('properties').select('title, code').eq('id', lease.property_id).maybeSingle(),
        ]);

        if (tenant?.email && property) {
          const result = await sendBoletoEmail({
            tenantName: tenant.name,
            tenantEmail: tenant.email,
            propertyTitle: property.title,
            propertyCode: property.code,
            description,
            amount: lease.rent_value,
            dueDate,
          });
          if (result.sent) emailsSent += 1;
        }
      }
    }
  }

  return NextResponse.json({ generated, skipped, emailsSent });
}
