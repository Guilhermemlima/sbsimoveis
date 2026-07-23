'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import CurrencyInput from '@/components/common/CurrencyInput';
import type { Property } from '@/types';
import { formatDateBR } from '@/lib/format';

interface Sale {
  id: string;
  property_id: string;
  realtor_id: string;
  realtorName: string;
  sale_value: number;
  commission_value: number;
  net_profit: number;
  sale_date: string;
  status: string;
  properties?: { title: string; code: string };
}

interface RealtorOption {
  id: string;
  name: string;
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [realtorOptions, setRealtorOptions] = useState<RealtorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [defaultCommission, setDefaultCommission] = useState(5);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; name: string } | null>(null);

  const [form, setForm] = useState({
    property_id: '',
    realtor_id: '',
    sale_value: '',
    commission_percentage: '5',
    costs: '0',
    advertising_costs: '0',
    operational_costs: '0',
    taxes: '0',
    sale_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const loadSales = () => {
    fetch('/api/admin/sales')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSales(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSales();
    fetch('/api/realtor/properties')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []));
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (!me) return;
        setCurrentUser(me);
        if (me.role === 'realtor') {
          setRealtorOptions([{ id: me.id, name: me.name }]);
          setForm((f) => ({ ...f, realtor_id: me.id }));
        }
      });
    fetch('/api/admin/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRealtorOptions(
            data.filter((u) => u.role === 'realtor').map((u) => ({ id: u.id, name: u.name }))
          );
        }
      })
      .catch(() => {});
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDefaultCommission(data.default_commission_rate);
          setForm((f) => ({ ...f, commission_percentage: String(data.default_commission_rate) }));
        }
      });
  }, []);

  const availableProperties = useMemo(
    () => properties.filter((p) => p.status === 'available' || p.status === 'reserved'),
    [properties]
  );

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const commissionValue = useMemo(() => {
    const value = Number(form.sale_value) || 0;
    const pct = Number(form.commission_percentage) || 0;
    return (value * pct) / 100;
  }, [form.sale_value, form.commission_percentage]);

  const netProfit = useMemo(() => {
    const costs = Number(form.costs) || 0;
    const advertising = Number(form.advertising_costs) || 0;
    const operational = Number(form.operational_costs) || 0;
    const taxes = Number(form.taxes) || 0;
    return commissionValue - costs - advertising - operational - taxes;
  }, [commissionValue, form.costs, form.advertising_costs, form.operational_costs, form.taxes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const selectedProperty = properties.find((p) => p.id === form.property_id);

    const res = await fetch('/api/admin/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id: form.property_id,
        realtor_id: form.realtor_id,
        sale_value: Number(form.sale_value),
        commission_percentage: Number(form.commission_percentage),
        costs: Number(form.costs),
        advertising_costs: Number(form.advertising_costs),
        operational_costs: Number(form.operational_costs),
        taxes: Number(form.taxes),
        sale_date: form.sale_date,
        notes: form.notes,
        purpose: selectedProperty?.purpose,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível registrar a venda.');
      return;
    }

    setForm((f) => ({
      ...f,
      property_id: '',
      sale_value: '',
      costs: '0',
      advertising_costs: '0',
      operational_costs: '0',
      taxes: '0',
      notes: '',
    }));
    setFormOpen(false);
    loadSales();
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
              href={currentUser?.role === 'realtor' ? '/realtor/dashboard' : '/admin/dashboard'}
              className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-2">Vendas</h1>
            <p className="text-navy-100">Registre vendas concluídas e acompanhe comissões</p>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Registrar Venda'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
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
              <label className={labelClass}>Imóvel vendido/alugado</label>
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
              <label className={labelClass}>Corretor responsável</label>
              <select
                required
                value={form.realtor_id}
                onChange={(e) => set('realtor_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione um corretor</option>
                {realtorOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Data da venda</label>
              <input
                required
                type="date"
                value={form.sale_date}
                onChange={(e) => set('sale_date', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Valor da venda</label>
              <CurrencyInput required value={form.sale_value} onChange={(digits) => set('sale_value', digits)} />
            </div>

            <div>
              <label className={labelClass}>Comissão (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.commission_percentage}
                onChange={(e) => set('commission_percentage', e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-gray-500 mt-1">Padrão: {defaultCommission}%</p>
            </div>

            <div>
              <label className={labelClass}>Custos gerais</label>
              <CurrencyInput value={form.costs} onChange={(digits) => set('costs', digits)} />
            </div>

            <div>
              <label className={labelClass}>Custos com publicidade</label>
              <CurrencyInput
                value={form.advertising_costs}
                onChange={(digits) => set('advertising_costs', digits)}
              />
            </div>

            <div>
              <label className={labelClass}>Custos operacionais</label>
              <CurrencyInput
                value={form.operational_costs}
                onChange={(digits) => set('operational_costs', digits)}
              />
            </div>

            <div>
              <label className={labelClass}>Impostos</label>
              <CurrencyInput value={form.taxes} onChange={(digits) => set('taxes', digits)} />
            </div>

            <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 flex flex-wrap gap-6 text-sm">
              <p>
                Comissão calculada:{' '}
                <strong className="text-navy-950">
                  R$ {commissionValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </strong>
              </p>
              <p>
                Lucro líquido da imobiliária:{' '}
                <strong className="text-navy-950">
                  R$ {netProfit.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </strong>
              </p>
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
                {submitting ? 'Salvando...' : 'Registrar Venda'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Imóvel</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Corretor</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Valor</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Comissão</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy-950">{sale.properties?.title ?? 'Imóvel'}</p>
                      <p className="text-xs text-gray-500">Código: {sale.properties?.code}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{sale.realtorName}</td>
                    <td className="px-6 py-4 font-semibold text-navy-950">
                      R$ {Number(sale.sale_value).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-green-600 font-semibold">
                      R$ {Number(sale.commission_value).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {formatDateBR(sale.sale_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && sales.length === 0 && (
            <div className="p-12 text-center text-gray-600">Nenhuma venda registrada ainda.</div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>
      </div>
    </div>
  );
}
