import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

const RENEWAL_WINDOW_DAYS = 60;
const RENT_ADJUSTMENT_OVERDUE_DAYS = 365;

function daysFromNow(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const { data: activeLeases } = await supabase
    .from('lease_contracts')
    .select('id, property_id, start_date, end_date, properties(title, code)')
    .eq('status', 'active');

  const leases = activeLeases ?? [];

  const contractsExpiringSoon = leases
    .map((l) => ({ ...l, daysUntilEnd: daysFromNow(l.end_date) }))
    .filter((l) => l.daysUntilEnd >= 0 && l.daysUntilEnd <= RENEWAL_WINDOW_DAYS)
    .sort((a, b) => a.daysUntilEnd - b.daysUntilEnd)
    .map((l) => ({
      lease_contract_id: l.id,
      property_id: l.property_id,
      property: l.properties,
      end_date: l.end_date,
      days_until_end: l.daysUntilEnd,
    }));

  const leaseIds = leases.map((l) => l.id);
  const { data: rentAdjustments } = leaseIds.length
    ? await supabase
        .from('lease_amendments')
        .select('lease_contract_id, applied_at')
        .eq('type', 'rent_adjustment')
        .eq('status', 'signed')
        .in('lease_contract_id', leaseIds)
    : { data: [] };

  const lastAdjustmentByLease = new Map<string, string>();
  for (const a of rentAdjustments ?? []) {
    const existing = lastAdjustmentByLease.get(a.lease_contract_id);
    if (!existing || a.applied_at > existing) lastAdjustmentByLease.set(a.lease_contract_id, a.applied_at);
  }

  const rentAdjustmentOverdue = leases
    .map((l) => {
      const lastAdjustment = lastAdjustmentByLease.get(l.id);
      const referenceDate = lastAdjustment ? lastAdjustment.slice(0, 10) : l.start_date;
      const daysSinceReference = -daysFromNow(referenceDate);
      return { ...l, daysSinceReference, lastAdjustment: lastAdjustment ?? null };
    })
    .filter((l) => l.daysSinceReference >= RENT_ADJUSTMENT_OVERDUE_DAYS)
    .sort((a, b) => b.daysSinceReference - a.daysSinceReference)
    .map((l) => ({
      lease_contract_id: l.id,
      property_id: l.property_id,
      property: l.properties,
      last_adjustment_at: l.lastAdjustment,
      days_since_last_adjustment: l.daysSinceReference,
    }));

  const { data: maintenanceAwaitingReview } = await supabase
    .from('maintenance_requests')
    .select('id, title, priority, status, created_at, property_id, properties(title, code)')
    .in('status', ['requested', 'under_review'])
    .order('created_at', { ascending: true });

  const { data: inspectionsPending } = await supabase
    .from('inspections')
    .select('id, type, status, scheduled_date, property_id, properties(title, code)')
    .in('status', ['pending', 'scheduled', 'confirmed', 'in_progress', 'with_pending_issues'])
    .order('scheduled_date', { ascending: true, nullsFirst: true });

  const { data: amendmentsPendingSignature } = await supabase
    .from('lease_amendments')
    .select('id, title, type, version, lease_contract_id, effective_date, lease_contracts(properties(title, code))')
    .eq('status', 'pending_signature')
    .order('created_at', { ascending: true });

  const today = new Date().toISOString().slice(0, 10);

  const [{ count: rentalPropertiesTotal }, { count: rentalPropertiesOccupied }, { count: overdueRentCharges }] =
    await Promise.all([
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('purpose', 'rent')
        .is('deleted_at', null),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('purpose', 'rent')
        .eq('status', 'rented')
        .is('deleted_at', null),
      supabase
        .from('financial_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('center', 'rental')
        .eq('type', 'revenue')
        .neq('status', 'paid')
        .neq('status', 'cancelled')
        .lt('due_date', today),
    ]);

  return NextResponse.json({
    contractsExpiringSoon,
    rentAdjustmentOverdue,
    maintenanceAwaitingReview: maintenanceAwaitingReview ?? [],
    inspectionsPending: inspectionsPending ?? [],
    amendmentsPendingSignature: amendmentsPendingSignature ?? [],
    occupancy: {
      total: rentalPropertiesTotal ?? 0,
      occupied: rentalPropertiesOccupied ?? 0,
    },
    counts: {
      contractsExpiringSoon: contractsExpiringSoon.length,
      rentAdjustmentOverdue: rentAdjustmentOverdue.length,
      maintenanceAwaitingReview: (maintenanceAwaitingReview ?? []).length,
      inspectionsPending: (inspectionsPending ?? []).length,
      amendmentsPendingSignature: (amendmentsPendingSignature ?? []).length,
      overdueRentCharges: overdueRentCharges ?? 0,
    },
  });
}
