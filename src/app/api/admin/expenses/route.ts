import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessFinance } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

const isAdmin = canAccessFinance;

async function getRentalProfitPool(supabase: ReturnType<typeof createServiceRoleClient>) {
  const { data: settings } = await supabase
    .from('app_settings')
    .select('rental_profit_expense_rate')
    .limit(1)
    .maybeSingle();
  const rate = Number(settings?.rental_profit_expense_rate ?? 0);

  const { data: feeCategory } = await supabase
    .from('financial_categories')
    .select('id')
    .eq('name', 'Taxa de Administração')
    .eq('center', 'rental')
    .maybeSingle();

  let totalCollected = 0;
  if (feeCategory) {
    const { data: feeRevenue } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('category_id', feeCategory.id)
      .eq('status', 'paid');
    totalCollected = (feeRevenue ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
  }

  const { data: usedExpenses } = await supabase
    .from('financial_transactions')
    .select('amount')
    .eq('funded_by_rental_profit', true)
    .neq('status', 'cancelled');
  const totalUsed = (usedExpenses ?? []).reduce((sum, t) => sum + Number(t.amount), 0);

  const limit = totalCollected * (rate / 100);
  const available = Math.max(limit - totalUsed, 0);

  return { rate, totalCollected, totalUsed, limit, available };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const { data: expenses, error } = await supabase
    .from('financial_transactions')
    .select('*, financial_categories(name)')
    .in('center', ['administrative', 'maintenance'])
    .eq('type', 'expense')
    .order('due_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = (expenses ?? []).map((e) => ({
    ...e,
    categoryName: e.financial_categories?.name ?? null,
  }));

  const pool = await getRentalProfitPool(supabase);

  return NextResponse.json({ expenses: enriched, pool });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const required = ['center', 'category_id', 'description', 'amount', 'due_date'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === '') {
      return NextResponse.json({ error: `Campo obrigatório faltando: ${field}` }, { status: 400 });
    }
  }
  if (!['administrative', 'maintenance'].includes(body.center)) {
    return NextResponse.json({ error: 'Centro financeiro inválido.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const amount = Number(body.amount);
  const fundedByRentalProfit = !!body.funded_by_rental_profit;

  if (fundedByRentalProfit) {
    const pool = await getRentalProfitPool(supabase);
    if (amount > pool.available) {
      return NextResponse.json(
        {
          error: `Limite do lucro da locação disponível para despesas excedido. Disponível: R$ ${pool.available.toFixed(2)}.`,
        },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from('financial_transactions')
    .insert({
      type: 'expense',
      center: body.center,
      category_id: body.category_id,
      description: body.description,
      amount,
      competence_date: body.competence_date || body.due_date,
      due_date: body.due_date,
      status: 'pending',
      funded_by_rental_profit: fundedByRentalProfit,
      created_by: user!.id,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit({
    user: user!,
    action: 'create',
    entityType: 'expense',
    entityId: data.id,
    description: `Lançou a despesa "${data.description}" (R$ ${amount.toFixed(2)})${fundedByRentalProfit ? ' custeada pelo lucro da locação' : ''}.`,
    metadata: { fundedByRentalProfit, center: body.center },
  });

  return NextResponse.json(data, { status: 201 });
}
