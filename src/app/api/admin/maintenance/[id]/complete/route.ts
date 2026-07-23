import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessMaintenance } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

const isAuthorized = canAccessMaintenance;

const LOCKED_STATUSES = ['completed', 'cancelled'];
const COMPLETABLE_FROM = ['approved', 'in_progress'];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase.from('maintenance_requests').select('*').eq('id', id).maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
  }
  if (LOCKED_STATUSES.includes(existing.status)) {
    return NextResponse.json({ error: 'Esta solicitação já foi concluída ou cancelada.' }, { status: 409 });
  }
  if (!COMPLETABLE_FROM.includes(existing.status)) {
    return NextResponse.json(
      { error: 'Só é possível concluir uma solicitação aprovada ou em andamento.' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const actualCost = Number(body.actualCost);
  const completedBy = String(body.completedBy || '').trim();

  if (!completedBy) {
    return NextResponse.json({ error: 'Informe quem executou o serviço.' }, { status: 400 });
  }
  if (!Number.isFinite(actualCost) || actualCost < 0) {
    return NextResponse.json({ error: 'Informe o custo real do serviço.' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: updated, error } = await supabase
    .from('maintenance_requests')
    .update({
      status: 'completed',
      actual_cost: actualCost,
      completed_by: completedBy,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const financialAction = existing.financial_action ?? 'none';
  let financialSummary = '';

  if (financialAction !== 'none' && !existing.financial_applied && actualCost > 0) {
    const { data: expenseCategory } = await supabase
      .from('financial_categories')
      .select('id')
      .eq('name', 'Manutenção')
      .eq('center', 'maintenance')
      .maybeSingle();

    if (expenseCategory) {
      await supabase.from('financial_transactions').insert({
        type: 'expense',
        center: 'maintenance',
        category_id: expenseCategory.id,
        property_id: existing.property_id,
        lease_contract_id: existing.lease_contract_id,
        owner_id: existing.owner_id,
        tenant_id: existing.tenant_id,
        created_by: user!.id,
        description: `Manutenção: ${existing.title}`,
        amount: actualCost,
        competence_date: today,
        due_date: today,
        paid_date: today,
        payment_method: 'automatic',
        status: 'paid',
      });
    }

    if (financialAction === 'owner_deduction' || financialAction === 'shared') {
      const ownerShare = financialAction === 'shared' ? Number(existing.owner_share_percentage) / 100 : 1;
      const deductionAmount = Math.round(actualCost * ownerShare * 100) / 100;
      if (deductionAmount > 0) {
        await supabase.from('maintenance_owner_deductions').insert({
          maintenance_request_id: id,
          property_id: existing.property_id,
          amount: deductionAmount,
          applied: false,
        });
        financialSummary = `dedução de R$ ${deductionAmount.toFixed(2)} do próximo repasse ao proprietário`;
      }
    }

    if (financialAction === 'tenant_charge') {
      const { data: tenantCategory } = await supabase
        .from('financial_categories')
        .select('id')
        .eq('name', 'Manutenção - Cobrança ao Inquilino')
        .eq('center', 'rental')
        .maybeSingle();

      if (tenantCategory) {
        await supabase.from('financial_transactions').insert({
          type: 'revenue',
          center: 'rental',
          category_id: tenantCategory.id,
          property_id: existing.property_id,
          lease_contract_id: existing.lease_contract_id,
          tenant_id: existing.tenant_id,
          created_by: user!.id,
          description: `Cobrança de manutenção ao inquilino: ${existing.title}`,
          amount: actualCost,
          competence_date: today,
          due_date: today,
          status: 'pending',
        });
        financialSummary = `cobrança de R$ ${actualCost.toFixed(2)} lançada ao inquilino`;
      }
    }

    if (financialAction === 'agency_expense') {
      financialSummary = 'custo assumido integralmente pela imobiliária';
    }
    if (financialAction === 'insurance_claim') {
      financialSummary = 'aguardando reembolso do seguro (reconciliação manual)';
    }

    const { data: reapplied } = await supabase
      .from('maintenance_requests')
      .update({ financial_applied: true, financial_applied_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (reapplied) Object.assign(updated, reapplied);
  }

  await logAudit({
    user: user!,
    action: 'complete',
    entityType: 'maintenance_request',
    entityId: id,
    description: `Concluiu a manutenção "${existing.title}" (custo R$ ${actualCost.toFixed(2)})${financialSummary ? ` — ${financialSummary}` : ''}.`,
  });

  return NextResponse.json(updated);
}
