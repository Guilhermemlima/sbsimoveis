import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessFinance } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!canAccessFinance(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const { data: rentalTransactions, error: rentalError } = await supabase
    .from('financial_transactions')
    .select('*, financial_categories(name), properties(title, code)')
    .in('center', ['rental', 'administrative', 'maintenance'])
    .order('due_date', { ascending: false });

  if (rentalError) return NextResponse.json({ error: rentalError.message }, { status: 500 });

  const { data: payouts, error: payoutsError } = await supabase
    .from('owner_payouts')
    .select('*, properties(title, code)')
    .order('competence_date', { ascending: false });

  if (payoutsError) return NextResponse.json({ error: payoutsError.message }, { status: 500 });

  const ownerIds = [...new Set((payouts ?? []).map((p) => p.owner_id))];
  let ownerNameById = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.from('property_owners').select('id, name').in('id', ownerIds);
    ownerNameById = new Map((owners ?? []).map((o) => [o.id, o.name]));
  }

  const rows = (rentalTransactions ?? []).map((t) => ({
    ...t,
    categoryName: t.financial_categories?.name ?? null,
  }));

  const rentCollected = rows
    .filter((t) => t.center === 'rental' && t.type === 'revenue' && t.categoryName === 'Aluguel Recebido' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const adminFeeRevenue = rows
    .filter((t) => t.center === 'rental' && t.type === 'revenue' && t.categoryName === 'Taxa de Administração' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const firstRentRetentionRevenue = rows
    .filter((t) => t.center === 'rental' && t.type === 'revenue' && t.categoryName === 'Taxa do Primeiro Aluguel' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const rentalExpensesPaid = rows
    .filter((t) => t.center === 'rental' && t.type === 'expense' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const adminExpensesPaid = rows
    .filter((t) => (t.center === 'administrative' || t.center === 'maintenance') && t.type === 'expense' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const adminExpensesPending = rows
    .filter((t) => (t.center === 'administrative' || t.center === 'maintenance') && t.type === 'expense' && t.status !== 'paid' && t.status !== 'cancelled')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const payoutsPaid = (payouts ?? []).filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.net_amount), 0);
  const payoutsPending = (payouts ?? []).filter((p) => p.status !== 'paid' && p.status !== 'cancelled').reduce((sum, p) => sum + Number(p.net_amount), 0);

  const summary = {
    rentCollected,
    adminFeeRevenue,
    firstRentRetentionRevenue,
    rentalExpensesPaid,
    adminExpensesPaid,
    adminExpensesPending,
    payoutsPaid,
    payoutsPending,
    agencyNetResult: adminFeeRevenue + firstRentRetentionRevenue - adminExpensesPaid - rentalExpensesPaid,
  };

  const enrichedPayouts = (payouts ?? []).map((p) => ({
    ...p,
    ownerName: ownerNameById.get(p.owner_id) ?? 'Proprietário',
  }));

  return NextResponse.json({ summary, transactions: rows, payouts: enrichedPayouts });
}
