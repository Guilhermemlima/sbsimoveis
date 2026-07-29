import type { SupabaseClient } from '@supabase/supabase-js';

export interface LeaseOwnerInput {
  owner_id: string;
  percentage: number;
  commission_rate?: number;
}

/**
 * Validates a list of co-owner shares for a lease contract.
 * Percentages must be positive and sum to 100 (within rounding tolerance).
 */
export function validateLeaseOwners(owners: LeaseOwnerInput[]): string | null {
  if (!owners || owners.length === 0) return 'Informe ao menos um proprietário.';

  const ids = new Set<string>();
  for (const o of owners) {
    if (!o.owner_id) return 'Selecione o proprietário em todas as linhas.';
    if (ids.has(o.owner_id)) return 'Cada proprietário só pode aparecer uma vez no contrato.';
    ids.add(o.owner_id);
    if (!o.percentage || o.percentage <= 0 || o.percentage > 100) {
      return 'O percentual de cada proprietário deve ser maior que 0 e no máximo 100.';
    }
  }

  const total = owners.reduce((sum, o) => sum + o.percentage, 0);
  if (Math.abs(total - 100) > 0.01) {
    return `A soma dos percentuais deve ser 100%. Total informado: ${total.toFixed(2)}%.`;
  }

  return null;
}

/** Inserts the lease_contract_owners rows for a newly created (or re-saved) lease contract. */
export async function saveLeaseOwners(
  supabase: SupabaseClient,
  leaseContractId: string,
  owners: LeaseOwnerInput[]
) {
  return supabase.from('lease_contract_owners').insert(
    owners.map((o) => ({
      lease_contract_id: leaseContractId,
      owner_id: o.owner_id,
      percentage: o.percentage,
      commission_rate: o.commission_rate ?? 0,
    }))
  );
}

/** Returns the primary (highest-percentage) owner id from a co-owner list. */
export function primaryOwnerId(owners: LeaseOwnerInput[]): string {
  return [...owners].sort((a, b) => b.percentage - a.percentage)[0].owner_id;
}
