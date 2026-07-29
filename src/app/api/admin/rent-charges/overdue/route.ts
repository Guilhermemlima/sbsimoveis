import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessFinance, hasFullPropertyAccess } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const isAuthorized = canAccessFinance;

// Padrão de mercado: multa fixa de 2% + juros de mora de 1% ao mês, pro-rata pelos dias em atraso.
const LATE_FEE_RATE = 0.02;
const LATE_INTEREST_RATE_MONTHLY = 0.01;

function daysLate(dueDate: string): number {
  const due = new Date(dueDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export async function GET() {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from('financial_transactions')
    .select('id, property_id, tenant_id, amount, due_date, description, properties(title, code)')
    .eq('center', 'rental')
    .eq('type', 'revenue')
    .eq('status', 'pending')
    .lt('due_date', todayStr)
    .order('due_date', { ascending: true });

  if (!hasFullPropertyAccess(user!)) {
    const { data: ownProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('realtor_id', user!.id);
    const ids = (ownProperties ?? []).map((p) => p.id);
    query = query.in('property_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000']);
  }

  const { data: charges, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tenantIds = [...new Set((charges ?? []).map((c) => c.tenant_id).filter(Boolean))];
  let tenantById = new Map<string, { name: string; phone: string | null; email: string | null }>();
  if (tenantIds.length > 0) {
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, name, phone, email')
      .in('id', tenantIds);
    tenantById = new Map((tenants ?? []).map((t) => [t.id, { name: t.name, phone: t.phone, email: t.email }]));
  }

  const enriched = (charges ?? []).map((c) => {
    const late = daysLate(c.due_date);
    const amount = Number(c.amount);
    const lateFee = Number((amount * LATE_FEE_RATE).toFixed(2));
    const interest = Number((amount * LATE_INTEREST_RATE_MONTHLY * (late / 30)).toFixed(2));
    const tenant = c.tenant_id ? tenantById.get(c.tenant_id) : null;
    const property = c.properties as unknown as { title: string; code: string } | null;

    return {
      id: c.id,
      tenantName: tenant?.name ?? 'Inquilino',
      tenantPhone: tenant?.phone ?? null,
      tenantEmail: tenant?.email ?? null,
      propertyTitle: property?.title ?? '',
      propertyCode: property?.code ?? '',
      description: c.description,
      amount,
      dueDate: c.due_date,
      daysLate: late,
      lateFee,
      interest,
      total: Number((amount + lateFee + interest).toFixed(2)),
    };
  });

  return NextResponse.json(enriched);
}
