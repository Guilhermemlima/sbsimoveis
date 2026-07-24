import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessAmendments } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { AMENDMENT_FIELD_LABEL, formatAmendmentValue } from '@/lib/amendments';

const isAuthorized = canAccessAmendments;

const APPLICABLE_LEASE_FIELDS = [
  'rent_value',
  'end_date',
  'admin_fee_percentage',
  'due_day',
  'deposit_value',
  'tenant_id',
  'owner_id',
  'water_responsible',
  'energy_responsible',
  'iptu_responsible',
  'insurance_responsible',
  'condo_responsible',
];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase.from('lease_amendments').select('*').eq('id', id).maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Aditivo não encontrado.' }, { status: 404 });
  }
  if (existing.status === 'signed') {
    return NextResponse.json({ error: 'Este aditivo já foi assinado.' }, { status: 409 });
  }
  if (existing.status !== 'pending_signature') {
    return NextResponse.json(
      { error: 'Somente aditivos aguardando assinatura podem ser assinados.' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const agencySignatureName = String(body.agencySignatureName || '').trim();
  if (!agencySignatureName) {
    return NextResponse.json({ error: 'Informe o nome de quem assina pela imobiliária.' }, { status: 400 });
  }

  const changes: Record<string, { from: unknown; to: unknown }> = existing.changes ?? {};
  const leaseUpdates: Record<string, unknown> = {};
  for (const [key, change] of Object.entries(changes)) {
    if (APPLICABLE_LEASE_FIELDS.includes(key)) {
      leaseUpdates[key] = change.to;
    }
  }

  if (Object.keys(leaseUpdates).length > 0) {
    leaseUpdates.updated_at = new Date().toISOString();
    const { error: leaseError } = await supabase
      .from('lease_contracts')
      .update(leaseUpdates)
      .eq('id', existing.lease_contract_id);
    if (leaseError) {
      return NextResponse.json({ error: leaseError.message }, { status: 400 });
    }
  }

  const now = new Date().toISOString();
  const { data: signed, error } = await supabase
    .from('lease_amendments')
    .update({
      status: 'signed',
      applied_at: now,
      agency_signature_name: agencySignatureName,
      agency_signed_at: now,
      owner_signature_name: body.ownerSignatureName || null,
      owner_signed_at: body.ownerSignatureName ? now : null,
      tenant_signature_name: body.tenantSignatureName || null,
      tenant_signed_at: body.tenantSignatureName ? now : null,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const names = new Map<string, string>();
  const referencedIds = new Set<string>();
  for (const key of ['tenant_id', 'owner_id']) {
    if (changes[key]) {
      if (changes[key].from) referencedIds.add(String(changes[key].from));
      if (changes[key].to) referencedIds.add(String(changes[key].to));
    }
  }
  if (referencedIds.size > 0) {
    const idList = [...referencedIds];
    const [{ data: owners }, { data: tenants }] = await Promise.all([
      supabase.from('property_owners').select('id, name').in('id', idList),
      supabase.from('tenants').select('id, name').in('id', idList),
    ]);
    for (const o of owners ?? []) names.set(o.id, o.name);
    for (const t of tenants ?? []) names.set(t.id, t.name);
  }

  const changeSummary = Object.entries(changes)
    .map(([key, change]) => {
      const label = AMENDMENT_FIELD_LABEL[key] ?? key;
      return `${label}: ${formatAmendmentValue(key, change.from, names)} → ${formatAmendmentValue(key, change.to, names)}`;
    })
    .join('; ');

  await logAudit({
    user: user!,
    action: 'sign_amendment',
    entityType: 'lease_contract',
    entityId: existing.lease_contract_id,
    description: `Assinou o aditivo "${existing.title}" (versão ${existing.version}) e aplicou ao contrato${changeSummary ? `: ${changeSummary}` : ''}.`,
  });

  return NextResponse.json(signed);
}
