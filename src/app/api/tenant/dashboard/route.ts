import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'tenant') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, email, phone, document_number')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: 'Cadastro de inquilino não encontrado.' }, { status: 404 });
  }

  const { data: leases } = await supabase
    .from('lease_contracts')
    .select(
      '*, properties(title, code, city, neighborhood, address)'
    )
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  const leaseIds = (leases ?? []).map((l) => l.id);

  const { data: charges } = leaseIds.length
    ? await supabase
        .from('financial_transactions')
        .select('*, financial_categories(name)')
        .in('lease_contract_id', leaseIds)
        .order('due_date', { ascending: false })
    : { data: [] };

  const enrichedCharges = (charges ?? []).map((c) => ({
    ...c,
    categoryName: c.financial_categories?.name ?? null,
  }));

  return NextResponse.json({ tenant, leases: leases ?? [], charges: enrichedCharges });
}
