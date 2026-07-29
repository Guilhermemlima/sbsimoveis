import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessFinance, hasFullPropertyAccess } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

const isAuthorized = canAccessFinance;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: charge } = await supabase
    .from('financial_transactions')
    .select(
      'id, type, status, property_id, lease_contract_id, owner_id, tenant_id, amount, competence_date, financial_categories(name)'
    )
    .eq('id', id)
    .maybeSingle();

  if (!charge) {
    return NextResponse.json({ error: 'Cobrança não encontrada.' }, { status: 404 });
  }

  if (!hasFullPropertyAccess(user!)) {
    const { data: property } = await supabase
      .from('properties')
      .select('realtor_id')
      .eq('id', charge.property_id)
      .maybeSingle();
    if (!property || property.realtor_id !== user!.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status === 'paid') {
    updates.status = 'paid';
    updates.paid_date = body.paid_date || new Date().toISOString().slice(0, 10);
    updates.payment_method = body.payment_method || 'manual';
  } else if (body.status) {
    updates.status = body.status;
  }

  const { data, error } = await supabase
    .from('financial_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.status === 'paid') {
    await logAudit({
      user: user!,
      action: 'mark_paid',
      entityType: 'rent_charge',
      entityId: id,
      description: `Marcou a cobrança "${data.description}" (R$ ${Number(data.amount).toFixed(2)}) como paga.`,
    });
  }

  const categoryField = charge.financial_categories as unknown as { name: string }[] | { name: string } | null;
  const categoryName = Array.isArray(categoryField) ? categoryField[0]?.name : categoryField?.name;

  const isRentRevenue =
    body.status === 'paid' &&
    charge.status !== 'paid' &&
    charge.type === 'revenue' &&
    categoryName === 'Aluguel Recebido' &&
    charge.lease_contract_id &&
    charge.owner_id;

  if (isRentRevenue) {
    const { data: lease } = await supabase
      .from('lease_contracts')
      .select(
        'admin_fee_percentage, first_rent_retention_type, first_rent_retention_percentage, first_rent_retention_fixed_amount, first_rent_retention_basis, first_rent_retention_include_extra_fees, first_rent_retention_installments, first_rent_retention_installments_applied, first_rent_retention_total_amount'
      )
      .eq('id', charge.lease_contract_id)
      .maybeSingle();

    const rentAmount = Number(charge.amount);
    const adminFeeAmount = lease ? rentAmount * (Number(lease.admin_fee_percentage) / 100) : 0;

    let retentionInstallmentAmount = 0;
    let retentionTotalAmount: number | null = lease?.first_rent_retention_total_amount
      ? Number(lease.first_rent_retention_total_amount)
      : null;

    const retentionType = lease?.first_rent_retention_type ?? 'none';
    const installments = lease?.first_rent_retention_installments ?? 1;
    const installmentsApplied = lease?.first_rent_retention_installments_applied ?? 0;
    const retentionPending = retentionType !== 'none' && installmentsApplied < installments;

    if (retentionPending) {
      if (retentionTotalAmount === null) {
        let extraFeesSum = 0;
        if (lease!.first_rent_retention_include_extra_fees) {
          const { data: extraFees } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('lease_contract_id', charge.lease_contract_id)
            .eq('center', 'rental')
            .eq('type', 'expense')
            .eq('competence_date', charge.competence_date);
          extraFeesSum = (extraFees ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
        }

        const base =
          (lease!.first_rent_retention_basis === 'net' ? rentAmount - adminFeeAmount : rentAmount) +
          extraFeesSum;

        if (retentionType === 'custom_amount') {
          retentionTotalAmount = Number(lease!.first_rent_retention_fixed_amount ?? 0);
        } else {
          const pct =
            retentionType === 'fifty_percent'
              ? 50
              : retentionType === 'hundred_percent'
                ? 100
                : Number(lease!.first_rent_retention_percentage ?? 0);
          retentionTotalAmount = base * (pct / 100);
        }
      }

      const remainingInstallments = installments - installmentsApplied;
      retentionInstallmentAmount =
        remainingInstallments === 1
          ? retentionTotalAmount - (retentionTotalAmount / installments) * (installments - 1)
          : retentionTotalAmount / installments;
      retentionInstallmentAmount = Math.round(retentionInstallmentAmount * 100) / 100;

      await supabase
        .from('lease_contracts')
        .update({
          first_rent_retention_total_amount: retentionTotalAmount,
          first_rent_retention_installments_applied: installmentsApplied + 1,
          first_rent_retention_applied_at:
            installmentsApplied === 0 ? new Date().toISOString() : undefined,
        })
        .eq('id', charge.lease_contract_id);

      if (retentionInstallmentAmount > 0) {
        const { data: retentionCategory } = await supabase
          .from('financial_categories')
          .select('id')
          .eq('name', 'Taxa do Primeiro Aluguel')
          .eq('center', 'rental')
          .maybeSingle();

        if (retentionCategory) {
          await supabase.from('financial_transactions').insert({
            type: 'revenue',
            center: 'rental',
            category_id: retentionCategory.id,
            property_id: charge.property_id,
            lease_contract_id: charge.lease_contract_id,
            created_by: user!.id,
            description:
              installments > 1
                ? `Taxa do primeiro aluguel — parcela ${installmentsApplied + 1}/${installments}`
                : 'Taxa do primeiro aluguel',
            amount: retentionInstallmentAmount,
            competence_date: charge.competence_date,
            due_date: updates.paid_date as string,
            paid_date: updates.paid_date as string,
            payment_method: 'automatic',
            status: 'paid',
          });
        }

        await logAudit({
          user: user!,
          action: 'apply_retention',
          entityType: 'lease_contract',
          entityId: charge.lease_contract_id,
          description: `Aplicou a retenção do primeiro aluguel: R$ ${retentionInstallmentAmount.toFixed(2)}${installments > 1 ? ` (parcela ${installmentsApplied + 1}/${installments})` : ''}.`,
        });
      }
    }

    const { data: pendingDeductions } = await supabase
      .from('maintenance_owner_deductions')
      .select('id, amount')
      .eq('property_id', charge.property_id)
      .eq('applied', false);

    const deductionsAmount = (pendingDeductions ?? []).reduce((sum, d) => sum + Number(d.amount), 0);

    const netAmount = rentAmount - adminFeeAmount - retentionInstallmentAmount - deductionsAmount;

    const { data: coOwners } = await supabase
      .from('lease_contract_owners')
      .select('owner_id, percentage')
      .eq('lease_contract_id', charge.lease_contract_id);

    const shares =
      coOwners && coOwners.length > 0
        ? coOwners
        : [{ owner_id: charge.owner_id, percentage: 100 }];

    const newPayoutIds: string[] = [];
    for (const share of shares) {
      const pct = Number(share.percentage) / 100;
      const { data: payout } = await supabase
        .from('owner_payouts')
        .insert({
          owner_id: share.owner_id,
          property_id: charge.property_id,
          lease_contract_id: charge.lease_contract_id,
          rent_charge_id: charge.id,
          competence_date: charge.competence_date,
          rent_amount: Number((rentAmount * pct).toFixed(2)),
          admin_fee_amount: Number((adminFeeAmount * pct).toFixed(2)),
          deductions_amount: Number((deductionsAmount * pct).toFixed(2)),
          first_rent_retention_amount: Number((retentionInstallmentAmount * pct).toFixed(2)),
          net_amount: Number((netAmount * pct).toFixed(2)),
          ownership_percentage: Number(share.percentage),
          status: 'pending',
        })
        .select('id')
        .single();
      if (payout) newPayoutIds.push(payout.id);
    }

    if (newPayoutIds.length > 0 && (pendingDeductions ?? []).length > 0) {
      await supabase
        .from('maintenance_owner_deductions')
        .update({ applied: true, owner_payout_id: newPayoutIds[0] })
        .in(
          'id',
          (pendingDeductions ?? []).map((d) => d.id)
        );

      await logAudit({
        user: user!,
        action: 'apply_maintenance_deduction',
        entityType: 'owner_payout',
        entityId: newPayoutIds[0],
        description: `Aplicou R$ ${deductionsAmount.toFixed(2)} em deduções de manutenção pendentes no repasse.`,
      });
    }

    if (adminFeeAmount > 0) {
      const { data: feeCategory } = await supabase
        .from('financial_categories')
        .select('id')
        .eq('name', 'Taxa de Administração')
        .eq('center', 'rental')
        .maybeSingle();

      if (feeCategory) {
        await supabase.from('financial_transactions').insert({
          type: 'revenue',
          center: 'rental',
          category_id: feeCategory.id,
          property_id: charge.property_id,
          lease_contract_id: charge.lease_contract_id,
          created_by: user!.id,
          description: 'Taxa de administração — aluguel',
          amount: adminFeeAmount,
          competence_date: charge.competence_date,
          due_date: updates.paid_date as string,
          paid_date: updates.paid_date as string,
          payment_method: 'automatic',
          status: 'paid',
        });
      }
    }
  }

  return NextResponse.json(data);
}
