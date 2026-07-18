'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Plus, X, CheckCircle2, Loader2 } from 'lucide-react';
import CurrencyInput from '@/components/common/CurrencyInput';
import { formatDateBR } from '@/lib/format';

interface Charge {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  tenantName: string | null;
  categoryName: string | null;
  properties?: { title: string; code: string };
}

interface Lease {
  id: string;
  properties?: { title: string; code: string };
}

interface Category {
  id: string;
  name: string;
  center: string;
  type: string;
}

const STATUS_LABEL: Record<string, string> = {
  predicted: 'Prevista',
  pending: 'Pendente',
  awaiting_approval: 'Aguardando Aprovação',
  scheduled: 'Agendada',
  paid: 'Paga',
  partially_paid: 'Paga Parcialmente',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
  disputed: 'Contestada',
  refunded: 'Reembolsada',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

export default function RentChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    lease_contract_id: '',
    category_id: '',
    description: '',
    amount: '',
    due_date: new Date().toISOString().slice(0, 10),
  });

  const loadCharges = () => {
    fetch('/api/admin/rent-charges')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCharges(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCharges();
    fetch('/api/admin/leases')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLeases(Array.isArray(data) ? data : []));
    fetch('/api/admin/financial-categories')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []));
  }, []);

  const rentalExpenseCategories = useMemo(
    () => categories.filter((c) => c.center === 'rental' && c.type === 'expense'),
    [categories]
  );

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateMessage('');
    const res = await fetch('/api/admin/rent-charges/generate', { method: 'POST' });
    const data = await res.json();
    setGenerating(false);
    if (res.ok) {
      setGenerateMessage(`${data.generated} cobrança(s) de aluguel gerada(s), ${data.skipped} já existiam.`);
      loadCharges();
    } else {
      setGenerateMessage(data.error || 'Erro ao gerar cobranças.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/admin/rent-charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível criar a cobrança.');
      return;
    }

    setForm({
      lease_contract_id: '',
      category_id: '',
      description: '',
      amount: '',
      due_date: new Date().toISOString().slice(0, 10),
    });
    setFormOpen(false);
    loadCharges();
  };

  const markAsPaid = async (id: string) => {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'paid' } : c)));
    await fetch(`/api/admin/rent-charges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    });
    loadCharges();
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
            <h1 className="text-3xl font-bold mb-2">Cobranças de Locação</h1>
            <p className="text-navy-100">Aluguel, água, energia, IPTU e outras cobranças</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-navy-950 rounded-lg font-bold hover:bg-navy-100 transition-colors disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              Gerar Aluguéis do Mês
            </button>
            <button
              onClick={() => setFormOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
            >
              {formOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {formOpen ? 'Cancelar' : 'Nova Cobrança'}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {generateMessage && (
          <div className="bg-white border border-gold-300 rounded-lg p-4 mb-6 text-sm text-navy-950">
            {generateMessage}
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
              <label className={labelClass}>Contrato de locação</label>
              <select
                required
                value={form.lease_contract_id}
                onChange={(e) => set('lease_contract_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione um contrato</option>
                {leases.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.properties?.title} · {l.properties?.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Tipo de cobrança</label>
              <select
                required
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione</option>
                {rentalExpenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Valor</label>
              <CurrencyInput required value={form.amount} onChange={(v) => set('amount', v)} />
            </div>

            <div>
              <label className={labelClass}>Descrição</label>
              <input
                required
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Ex: Conta de água — Julho/2026"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Vencimento</label>
              <input
                required
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : 'Criar Cobrança'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Descrição</th>
                  <th className="px-6 py-3">Imóvel</th>
                  <th className="px-6 py-3">Inquilino</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Vencimento</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id} className="border-t border-gray-100">
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-950">{charge.description}</p>
                      <p className="text-xs text-gray-500">{charge.categoryName}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {charge.properties?.title} · {charge.properties?.code}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{charge.tenantName ?? '—'}</td>
                    <td className="px-6 py-4 font-semibold text-navy-950">
                      R$ {Number(charge.amount).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDateBR(charge.due_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[charge.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUS_LABEL[charge.status] ?? charge.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {charge.status !== 'paid' && (
                        <button
                          onClick={() => markAsPaid(charge.id)}
                          className="inline-flex items-center gap-1 text-green-700 hover:text-green-800 font-semibold"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Marcar como paga
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && charges.length === 0 && (
            <div className="p-12 text-center text-gray-600">Nenhuma cobrança registrada ainda.</div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>
      </div>
    </div>
  );
}
