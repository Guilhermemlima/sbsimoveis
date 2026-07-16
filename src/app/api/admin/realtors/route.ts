import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const [realtorsRes, usersRes, propertiesRes, salesRes] = await Promise.all([
    supabase.from('realtors').select('id, creci, commission_rate, status, created_at'),
    supabase.from('users').select('id, name, email, phone'),
    supabase.from('properties').select('id, realtor_id, status').is('deleted_at', null),
    supabase.from('sales').select('realtor_id, sale_value, commission_value'),
  ]);

  const realtors = realtorsRes.data ?? [];
  const usersById = new Map((usersRes.data ?? []).map((u) => [u.id, u]));
  const properties = propertiesRes.data ?? [];
  const sales = salesRes.data ?? [];

  const result = realtors.map((r) => {
    const info = usersById.get(r.id);
    const ownProperties = properties.filter((p) => p.realtor_id === r.id);
    const ownSales = sales.filter((s) => s.realtor_id === r.id);

    return {
      id: r.id,
      name: info?.name ?? 'Corretor',
      email: info?.email ?? '',
      phone: info?.phone ?? null,
      creci: r.creci,
      commissionRate: r.commission_rate,
      status: r.status,
      totalProperties: ownProperties.length,
      availableProperties: ownProperties.filter((p) => p.status === 'available').length,
      soldProperties: ownProperties.filter((p) => p.status === 'sold').length,
      totalSales: ownSales.length,
      totalCommission: ownSales.reduce((sum, s) => sum + Number(s.commission_value ?? 0), 0),
      totalSalesValue: ownSales.reduce((sum, s) => sum + Number(s.sale_value ?? 0), 0),
    };
  });

  result.sort((a, b) => b.totalSalesValue - a.totalSalesValue);

  return NextResponse.json(result);
}
