import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';

export interface ScheduleItem {
  id: string;
  kind: 'rent_charge' | 'expense' | 'owner_payout' | 'lease_renewal';
  description: string;
  amount: number | null;
  date: string;
  status: string;
  propertyLabel: string | null;
}

type PropertyRef = { title: string; code: string } | { title: string; code: string }[] | null;

function propertyLabel(properties: PropertyRef): string | null {
  const p = Array.isArray(properties) ? properties[0] : properties;
  return p ? `${p.title} · ${p.code}` : null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const items: ScheduleItem[] = [];

  const { data: transactions } = await supabase
    .from('financial_transactions')
    .select('id, type, description, amount, due_date, status, properties(title, code)')
    .in('status', ['pending', 'overdue'])
    .order('due_date', { ascending: true });

  for (const t of transactions ?? []) {
    items.push({
      id: t.id,
      kind: t.type === 'expense' ? 'expense' : 'rent_charge',
      description: t.description,
      amount: Number(t.amount),
      date: t.due_date,
      status: t.status,
      propertyLabel: propertyLabel(t.properties as PropertyRef),
    });
  }

  const { data: payouts } = await supabase
    .from('owner_payouts')
    .select('id, net_amount, competence_date, status, properties(title, code)')
    .eq('status', 'pending')
    .order('competence_date', { ascending: true });

  for (const p of payouts ?? []) {
    items.push({
      id: p.id,
      kind: 'owner_payout',
      description: 'Repasse ao proprietário',
      amount: Number(p.net_amount),
      date: p.competence_date,
      status: p.status,
      propertyLabel: propertyLabel(p.properties as PropertyRef),
    });
  }

  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
  const cutoff = sixtyDaysFromNow.toISOString().slice(0, 10);

  const { data: leases } = await supabase
    .from('lease_contracts')
    .select('id, end_date, status, properties(title, code)')
    .eq('status', 'active')
    .lte('end_date', cutoff)
    .order('end_date', { ascending: true });

  for (const l of leases ?? []) {
    items.push({
      id: l.id,
      kind: 'lease_renewal',
      description: 'Contrato de locação vencendo — renovar ou encerrar',
      amount: null,
      date: l.end_date,
      status: 'upcoming',
      propertyLabel: propertyLabel(l.properties as PropertyRef),
    });
  }

  items.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(items);
}
