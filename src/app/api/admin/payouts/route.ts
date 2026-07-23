import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessFinance, hasFullPropertyAccess } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const isAuthorized = canAccessFinance;

export async function GET() {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  let query = supabase
    .from('owner_payouts')
    .select('*, properties(title, code)')
    .order('competence_date', { ascending: false });

  if (!hasFullPropertyAccess(user!)) {
    const { data: ownProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('realtor_id', user!.id);
    const ids = (ownProperties ?? []).map((p) => p.id);
    query = query.in('property_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000']);
  }

  const { data: payouts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ownerIds = [...new Set((payouts ?? []).map((p) => p.owner_id))];
  let ownerNameById = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.from('property_owners').select('id, name, pix_key').in('id', ownerIds);
    ownerNameById = new Map((owners ?? []).map((o) => [o.id, o.name]));
  }

  const enriched = (payouts ?? []).map((p) => ({
    ...p,
    ownerName: ownerNameById.get(p.owner_id) ?? 'Proprietário',
  }));

  return NextResponse.json(enriched);
}
