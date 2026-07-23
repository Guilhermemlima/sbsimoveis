'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Loader2, FileText, ShieldCheck, FileEdit } from 'lucide-react';
import CurrencyInput from '@/components/common/CurrencyInput';
import type { Property, PropertyOwner, Tenant, BillingResponsible, DepositDeduction } from '@/types';

interface Lease {
  id: string;
  property_id: string;
  owner_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  due_day: number;
  rent_value: number;
  admin_fee_percentage: number;
  deposit_value: number;
  deposit_status: string;
  deposit_returned_amount?: number | null;
  first_rent_retention_type: string;
  first_rent_retention_installments: number;
  first_rent_retention_installments_applied: number;
  status: string;
  ownerName: string;
  tenantName: string;
  properties?: { title: string; code: string; city: string; neighborhood: string };
}

const DEPOSIT_STATUS_LABEL: Record<string, string> = {
  held: 'Retida',
  partially_refunded: 'Devolvida parcialmente',
  refunded: 'Devolvida',
  forfeited: 'Retida integralmente',
};

const DEPOSIT_STATUS_COLOR: Record<string, string> = {
  held: 'bg-blue-100 text-blue-800',
  partially_refunded: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-green-100 text-green-800',
  forfeited: 'bg-red-100 text-red-800',
};

const RESPONSIBLE_LABEL: Record<BillingResponsible, string> = {
  tenant: 'Inquilino',
  owner: 'Proprietário',
  agency: 'Imobiliária',
  split: 'Dividido',
  not_applicable: 'Não se aplica',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  expiring_soon: 'Vencendo em breve',
  expired: 'Vencido',
  terminated: 'Encerrado',
  cancelled: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-800',
  expiring_soon: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
  terminated: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-100 text-gray-500',
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

const RETENTION_TYPE_LABEL: Record<string, string> = {
  none: 'Não reter o primeiro aluguel',
  fifty_percent: 'Reter 50% do primeiro aluguel',
  hundred_percent: 'Reter 100% do primeiro aluguel',
  custom_percentage: 'Percentual personalizado',
  custom_amount: 'Valor fixo personalizado',
};

const responsibleFields: { key: string; label: string }[] = [
  { key: 'water_responsible', label: 'Água' },
  { key: 'energy_responsible', label: 'Energia' },
  { key: 'iptu_responsible', label: 'IPTU' },
  { key: 'insurance_responsible', label: 'Seguro' },
  { key: 'condo_responsible', label: 'Condomínio' },
];

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [depositLeaseId, setDepositLeaseId] = useState<string | null>(null);
  const [deductions, setDeductions] = useState<DepositDeduction[]>([]);
  const [deductionForm, setDeductionForm] = useState({ description: '', amount: '' });
  const [settling, setSettling] = useState(false);
  const [settleResult, setSettleResult] = useState<{ refundAmount: number; totalDeductions: number } | null>(
    null
  );

  const [form, setForm] = useState<Record<string, string>>({
    property_id: '',
    owner_id: '',
    tenant_id: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    due_day: '10',
    rent_value: '',
    admin_fee_percentage: '10',
    deposit_value: '0',
    water_responsible: 'tenant',
    energy_responsible: 'tenant',
    iptu_responsible: 'owner',
    insurance_responsible: 'tenant',
    condo_responsible: 'tenant',
    notes: '',
    first_rent_retention_type: 'none',
    first_rent_retention_percentage: '',
    first_rent_retention_fixed_amount: '',
    first_rent_retention_basis: 'gross',
    first_rent_retention_include_extra_fees: '',
    first_rent_retention_installments: '1',
    first_rent_retention_notes: '',
  });

  const loadLeases = () => {
    fetch('/api/admin/leases')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLeases(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeases();
    fetch('/api/realtor/properties')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []));
    fetch('/api/admin/owners')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOwners(Array.isArray(data) ? data : []));
    fetch('/api/admin/tenants')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTenants(Array.isArray(data) ? data : []));
  }, []);

  const availableProperties = useMemo(
    () => properties.filter((p) => p.status === 'available' || p.status === 'reserved'),
    [properties]
  );

  const retentionPreview = useMemo(() => {
    const rentValue = Number(form.rent_value) || 0;
    const adminFeePct = Number(form.admin_fee_percentage) || 0;
    const adminFeeAmount = rentValue * (adminFeePct / 100);
    const type = form.first_rent_retention_type;

    if (!rentValue || type === 'none') return null;

    const base = form.first_rent_retention_basis === 'net' ? rentValue - adminFeeAmount : rentValue;

    let retentionAmount = 0;
    if (type === 'custom_amount') {
      retentionAmount = Number(form.first_rent_retention_fixed_amount) || 0;
    } else {
      const pct =
        type === 'fifty_percent'
          ? 50
          : type === 'hundred_percent'
            ? 100
            : Number(form.first_rent_retention_percentage) || 0;
      retentionAmount = base * (pct / 100);
    }

    const installments = Number(form.first_rent_retention_installments) || 1;
    const perInstallment = retentionAmount / installments;
    const ownerNet = rentValue - adminFeeAmount - perInstallment;

    return { rentValue, adminFeeAmount, retentionAmount, perInstallment, ownerNet, installments };
  }, [
    form.rent_value,
    form.admin_fee_percentage,
    form.first_rent_retention_type,
    form.first_rent_retention_basis,
    form.first_rent_retention_fixed_amount,
    form.first_rent_retention_percentage,
    form.first_rent_retention_installments,
  ]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const openDeposit = (leaseId: string) => {
    setDepositLeaseId(leaseId);
    setSettleResult(null);
    setDeductionForm({ description: '', amount: '' });
    fetch(`/api/admin/leases/${leaseId}/deductions`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDeductions(Array.isArray(data) ? data : []));
  };

  const addDeduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositLeaseId || !deductionForm.description || !deductionForm.amount) return;

    const res = await fetch(`/api/admin/leases/${depositLeaseId}/deductions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: deductionForm.description, amount: Number(deductionForm.amount) }),
    });

    if (res.ok) {
      setDeductionForm({ description: '', amount: '' });
      openDeposit(depositLeaseId);
    }
  };

  const settleDeposit = async () => {
    if (!depositLeaseId) return;
    setSettling(true);
    const res = await fetch(`/api/admin/leases/${depositLeaseId}/settle-deposit`, { method: 'POST' });
    const data = await res.json();
    setSettling(false);
    if (res.ok) {
      setSettleResult({ refundAmount: data.refundAmount, totalDeductions: data.totalDeductions });
      loadLeases();
    } else {
      setError(data.error || 'Não foi possível finalizar a devolução.');
    }
  };

  const depositLease = leases.find((l) => l.id === depositLeaseId);
  const deductionsTotal = deductions.reduce((sum, d) => sum + Number(d.amount), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.property_id || !form.owner_id || !form.tenant_id || !form.end_date || !form.rent_value) {
      setError('Preencha imóvel, proprietário, inquilino, valor do aluguel e data final.');
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/admin/leases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        due_day: Number(form.due_day),
        rent_value: Number(form.rent_value),
        admin_fee_percentage: Number(form.admin_fee_percentage),
        deposit_value: Number(form.deposit_value),
        first_rent_retention_installments: Number(form.first_rent_retention_installments) || 1,
        first_rent_retention_include_extra_fees: form.first_rent_retention_include_extra_fees === 'true',
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível criar o contrato.');
      return;
    }

    setForm((f) => ({
      ...f,
      property_id: '',
      owner_id: '',
      tenant_id: '',
      rent_value: '',
      end_date: '',
      first_rent_retention_type: 'none',
      first_rent_retention_percentage: '',
      first_rent_retention_fixed_amount: '',
      first_rent_retention_installments: '1',
      first_rent_retention_include_extra_fees: '',
      first_rent_retention_notes: '',
    }));
    setFormOpen(false);
    loadLeases();
    fetch('/api/realtor/properties')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FileText className="w-7 h-7 text-gold-400" />
              Contratos de Locação
            </h1>
            <p className="text-navy-100">
              Vincule imóvel, proprietário e inquilino com os termos do aluguel
            </p>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Novo Contrato'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {(owners.length === 0 || tenants.length === 0) && !loading && (
          <div className="bg-gold-50 border border-gold-300 rounded-lg p-4 mb-6 text-sm text-navy-950">
            Antes de criar um contrato, cadastre pelo menos um{' '}
            <Link href="/admin/owners" className="text-gold-700 font-semibold hover:underline">
              proprietário
            </Link>{' '}
            e um{' '}
            <Link href="/admin/tenants" className="text-gold-700 font-semibold hover:underline">
              inquilino
            </Link>
            .
          </div>
        )}

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-md p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {error && (
              <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="md:col-span-2">
              <label className={labelClass}>Imóvel</label>
              <select
                required
                value={form.property_id}
                onChange={(e) => set('property_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione um imóvel</option>
                {availableProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Proprietário</label>
              <select
                required
                value={form.owner_id}
                onChange={(e) => set('owner_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Inquilino</label>
              <select
                required
                value={form.tenant_id}
                onChange={(e) => set('tenant_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Início do contrato</label>
              <input
                required
                type="date"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Fim do contrato</label>
              <input
                required
                type="date"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Valor do aluguel (mensal)</label>
              <CurrencyInput required value={form.rent_value} onChange={(v) => set('rent_value', v)} />
            </div>

            <div>
              <label className={labelClass}>Dia de vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.due_day}
                onChange={(e) => set('due_day', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Taxa de administração (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.admin_fee_percentage}
                onChange={(e) => set('admin_fee_percentage', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Caução</label>
              <CurrencyInput value={form.deposit_value} onChange={(v) => set('deposit_value', v)} />
            </div>

            <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 space-y-4">
              <p className="text-sm font-semibold text-navy-950">
                Taxa de administração do primeiro aluguel
              </p>

              <div>
                <label className={labelClass}>Retenção</label>
                <select
                  value={form.first_rent_retention_type}
                  onChange={(e) => set('first_rent_retention_type', e.target.value)}
                  className={inputClass}
                >
                  {Object.entries(RETENTION_TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {form.first_rent_retention_type !== 'none' && (
                <>
                  {form.first_rent_retention_type === 'custom_percentage' && (
                    <div>
                      <label className={labelClass}>Percentual retido (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={form.first_rent_retention_percentage}
                        onChange={(e) => set('first_rent_retention_percentage', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}

                  {form.first_rent_retention_type === 'custom_amount' && (
                    <div>
                      <label className={labelClass}>Valor fixo retido</label>
                      <CurrencyInput
                        value={form.first_rent_retention_fixed_amount}
                        onChange={(v) => set('first_rent_retention_fixed_amount', v)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.first_rent_retention_type !== 'custom_amount' && (
                      <div>
                        <label className={labelClass}>Base de cálculo</label>
                        <select
                          value={form.first_rent_retention_basis}
                          onChange={(e) => set('first_rent_retention_basis', e.target.value)}
                          className={inputClass}
                        >
                          <option value="gross">Valor bruto do aluguel</option>
                          <option value="net">Valor líquido (após taxa de administração)</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className={labelClass}>Dividir retenção em quantos meses</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={form.first_rent_retention_installments}
                        onChange={(e) => set('first_rent_retention_installments', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.first_rent_retention_include_extra_fees === 'true'}
                      onChange={(e) =>
                        set('first_rent_retention_include_extra_fees', e.target.checked ? 'true' : '')
                      }
                    />
                    Incluir água, energia, IPTU, condomínio e seguro do primeiro mês no cálculo
                  </label>

                  <div>
                    <label className={labelClass}>Observação interna (opcional)</label>
                    <textarea
                      value={form.first_rent_retention_notes}
                      onChange={(e) => set('first_rent_retention_notes', e.target.value)}
                      rows={2}
                      className={inputClass}
                      placeholder="Justificativa da retenção, combinado com o proprietário, etc."
                    />
                  </div>

                  {retentionPreview && (
                    <div className="bg-white border border-gold-300 rounded-lg p-4 text-sm space-y-1">
                      <p className="font-semibold text-navy-950 mb-2">
                        Prévia do cálculo (1ª parcela de {retentionPreview.installments})
                      </p>
                      <div className="flex justify-between text-gray-700">
                        <span>Valor do primeiro aluguel</span>
                        <span>R$ {retentionPreview.rentValue.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Taxa de administração mensal</span>
                        <span>- R$ {retentionPreview.adminFeeAmount.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-red-700 font-semibold">
                        <span>Retido pela SBS Imóveis (nesta parcela)</span>
                        <span>- R$ {retentionPreview.perInstallment.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-green-700 font-bold border-t border-gray-200 pt-1 mt-1">
                        <span>Repasse líquido ao proprietário</span>
                        <span>R$ {retentionPreview.ownerNet.toLocaleString('pt-BR')}</span>
                      </div>
                      {retentionPreview.installments > 1 && (
                        <p className="text-xs text-gray-500 pt-1">
                          Total retido ao longo de {retentionPreview.installments} meses: R${' '}
                          {retentionPreview.retentionAmount.toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-navy-950 mb-3">
                Responsável por cada cobrança
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {responsibleFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {field.label}
                    </label>
                    <select
                      value={form[field.key]}
                      onChange={(e) => set(field.key, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      {Object.entries(RESPONSIBLE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Salvando...' : 'Criar Contrato'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Imóvel</th>
                  <th className="px-6 py-3">Proprietário</th>
                  <th className="px-6 py-3">Inquilino</th>
                  <th className="px-6 py-3">Aluguel</th>
                  <th className="px-6 py-3">Vencimento</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Caução</th>
                  <th className="px-6 py-3">Retenção 1º Aluguel</th>
                  <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((lease) => (
                  <tr key={lease.id} className="border-t border-gray-100">
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-950">{lease.properties?.title}</p>
                      <p className="text-xs text-gray-500">{lease.properties?.code}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{lease.ownerName}</td>
                    <td className="px-6 py-4 text-gray-600">{lease.tenantName}</td>
                    <td className="px-6 py-4 font-semibold text-navy-950">
                      R$ {Number(lease.rent_value).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">Dia {lease.due_day}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[lease.status]}`}
                      >
                        {STATUS_LABEL[lease.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {Number(lease.deposit_value) > 0 ? (
                        <button
                          onClick={() => openDeposit(lease.id)}
                          className="inline-flex items-center gap-1 text-navy-700 hover:text-navy-900 font-semibold text-xs"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          R$ {Number(lease.deposit_value).toLocaleString('pt-BR')} ·{' '}
                          {DEPOSIT_STATUS_LABEL[lease.deposit_status] ?? lease.deposit_status}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Sem caução</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {lease.first_rent_retention_type !== 'none' ? (
                        <span>
                          {RETENTION_TYPE_LABEL[lease.first_rent_retention_type] ?? lease.first_rent_retention_type}
                          {lease.first_rent_retention_installments > 1 && (
                            <>
                              {' '}
                              ({lease.first_rent_retention_installments_applied}/
                              {lease.first_rent_retention_installments})
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/amendments?lease=${lease.id}`}
                        className="inline-flex items-center gap-1 text-navy-700 hover:text-navy-900 font-semibold text-xs"
                      >
                        <FileEdit className="w-4 h-4" />
                        Aditivos
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && leases.length === 0 && (
            <div className="p-12 text-center text-gray-600">Nenhum contrato de locação ainda.</div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>

        {depositLease && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-navy-600" />
                    Caução — {depositLease.properties?.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Valor retido: R$ {Number(depositLease.deposit_value).toLocaleString('pt-BR')}
                  </p>
                </div>
                <button onClick={() => setDepositLeaseId(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${DEPOSIT_STATUS_COLOR[depositLease.deposit_status] ?? 'bg-gray-100 text-gray-700'}`}
              >
                {DEPOSIT_STATUS_LABEL[depositLease.deposit_status] ?? depositLease.deposit_status}
              </span>

              {depositLease.deposit_status !== 'held' ? (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-navy-950">
                  Devolução finalizada: R${' '}
                  {Number(depositLease.deposit_returned_amount ?? 0).toLocaleString('pt-BR')}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Deduções (vistoria de saída)</p>
                    {deductions.length === 0 && (
                      <p className="text-sm text-gray-400">Nenhuma dedução lançada.</p>
                    )}
                    <ul className="space-y-1">
                      {deductions.map((d) => (
                        <li key={d.id} className="flex justify-between text-sm border-b border-gray-100 py-1">
                          <span className="text-gray-700">{d.description}</span>
                          <span className="font-semibold text-navy-950">
                            R$ {Number(d.amount).toLocaleString('pt-BR')}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {deductions.length > 0 && (
                      <p className="text-right text-sm font-bold text-navy-950 mt-2">
                        Total: R$ {deductionsTotal.toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>

                  <form onSubmit={addDeduction} className="flex gap-2 mb-6">
                    <input
                      placeholder="Descrição (ex: pintura, limpeza)"
                      value={deductionForm.description}
                      onChange={(e) => setDeductionForm((f) => ({ ...f, description: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="w-32">
                      <CurrencyInput
                        value={deductionForm.amount}
                        onChange={(v) => setDeductionForm((f) => ({ ...f, amount: v }))}
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-navy-100 text-navy-900 rounded-lg font-semibold text-sm hover:bg-navy-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  {settleResult ? (
                    <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-sm text-navy-950">
                      Devolução finalizada. Valor devolvido ao inquilino: R${' '}
                      {settleResult.refundAmount.toLocaleString('pt-BR')} (deduções: R${' '}
                      {settleResult.totalDeductions.toLocaleString('pt-BR')})
                    </div>
                  ) : (
                    <button
                      onClick={settleDeposit}
                      disabled={settling}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-navy-950 text-white rounded-lg font-bold hover:bg-navy-900 transition-colors disabled:opacity-50"
                    >
                      {settling && <Loader2 className="w-4 h-4 animate-spin" />}
                      Finalizar devolução da caução
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
