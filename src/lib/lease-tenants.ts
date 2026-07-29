import type { SupabaseClient } from '@supabase/supabase-js';

export interface LeaseTenantInput {
  tenant_id: string;
  participation_percentage: number;
}

/**
 * Validates a list of co-tenant shares for a lease contract.
 * Percentages must be positive and sum to 100 (within rounding tolerance).
 */
export function validateLeaseTenants(tenants: LeaseTenantInput[]): string | null {
  if (!tenants || tenants.length === 0) return 'Informe ao menos um inquilino.';

  const ids = new Set<string>();
  for (const t of tenants) {
    if (!t.tenant_id) return 'Selecione o inquilino em todas as linhas.';
    if (ids.has(t.tenant_id)) return 'Cada inquilino só pode aparecer uma vez no contrato.';
    ids.add(t.tenant_id);
    if (!t.participation_percentage || t.participation_percentage <= 0 || t.participation_percentage > 100) {
      return 'A participação de cada inquilino deve ser maior que 0 e no máximo 100.';
    }
  }

  const total = tenants.reduce((sum, t) => sum + t.participation_percentage, 0);
  if (Math.abs(total - 100) > 0.01) {
    return `A soma das participações deve ser 100%. Total informado: ${total.toFixed(2)}%.`;
  }

  return null;
}

/** Inserts the lease_contract_tenants rows for a newly created lease contract. */
export async function saveLeaseTenants(
  supabase: SupabaseClient,
  leaseContractId: string,
  tenants: LeaseTenantInput[]
) {
  return supabase.from('lease_contract_tenants').insert(
    tenants.map((t) => ({
      lease_contract_id: leaseContractId,
      tenant_id: t.tenant_id,
      participation_percentage: t.participation_percentage,
    }))
  );
}

/** Returns the primary (highest-participation) tenant id from a co-tenant list. */
export function primaryTenantId(tenants: LeaseTenantInput[]): string {
  return [...tenants].sort((a, b) => b.participation_percentage - a.participation_percentage)[0].tenant_id;
}
