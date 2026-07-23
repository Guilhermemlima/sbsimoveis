'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BackToDashboardLink from '@/components/common/BackToDashboardLink';
import { Plus, X, CheckCircle2, PiggyBank } from 'lucide-react';
import CurrencyInput from '@/components/common/CurrencyInput';
import { formatDateBR } from '@/lib/format';

interface Expense {
  id: string;
  center: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  categoryName: string | null;
  funded_by_rental_profit: boolean;
}

interface Category {
  id: string;
  name: string;
  center: string;
  type: string;
}

interface Pool {
  rate: number;
  totalCollected: number;
  totalUsed: number;
  limit: number;
  available: number;
}

const CENTER_LABEL: Record<string, string> = {
  administrative: 'Administrativa',
  maintenance: 'Manutenção',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Paga',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    center: 'administrative',
    category_id: '',
    description: '',
    amount: '',
    due_date: new Date().toISOString().slice(0, 10),
    funded_by_rental_profit: false,
  });

  const loadExpenses = () => {
    fetch('/api/admin/expenses')
      .then((res) => (res.ok ? res.json() : { expenses: [], pool: null }))
      .then((data) => {
        setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
        setPool(data.pool ?? null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExpenses();
    fetch('/api/admin/financial-categories')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []));
  }, []);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.center === form.center && c.type === 'expense'),
    [categories, form.center]
  );

  const set = (key: keyof typeof form, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/admin/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível criar a despesa.');
      return;
    }

    setForm({
      center: 'administrative',
      category_id: '',
      description: '',
      amount: '',
      due_date: new Date().toISOString().slice(0, 10),
      funded_by_rental_profit: false,
    });
    setFormOpen(false);
    loadExpenses();
  };

  const markAsPaid = async (id: string) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'paid' } : e)));
    await fetch(`/api/admin/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    });
    loadExpenses();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <BackToDashboardLink />
            <h1 className="text-3xl font-bold mb-2">Despesas</h1>
            <p className="text-navy-100">Despesas administrativas e de manutenção</p>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Nova Despesa'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {pool && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank className="w-5 h-5 text-navy-600" />
              <h2 className="font-bold text-navy-950">Lucro da Locação disponível para despesas</h2>
            </div>
            {pool.rate === 0 ? (
              <p className="text-sm text-gray-500">
                Regra desativada (0%). Configure o percentual em{' '}
                <Link href="/admin/settings" className="text-gold-700 font-semibold hover:underline">
                  Configurações
                </Link>{' '}
                para permitir que despesas administrativas sejam custeadas com a taxa de administração
                recebida dos aluguéis — o dinheiro dos proprietários nunca é usado.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Regra configurada</p>
                  <p className="font-bold text-navy-950">{pool.rate}% do lucro</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Total arrecadado</p>
                  <p className="font-bold text-navy-950">R$ {pool.totalCollected.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Já utilizado</p>
                  <p className="font-bold text-navy-950">R$ {pool.totalUsed.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Disponível agora</p>
                  <p className="font-bold text-green-800">R$ {pool.available.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            )}
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

            <div>
              <label className={labelClass}>Centro financeiro</label>
              <select
                value={form.center}
                onChange={(e) => set('center', e.target.value)}
                className={inputClass}
              >
                <option value="administrative">Administrativa</option>
                <option value="maintenance">Manutenção</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Categoria</label>
              <select
                required
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione</option>
                {expenseCategories.map((c) => (
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
              <label className={labelClass}>Descrição</label>
              <input
                required
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Ex: Mensalidade do sistema, honorários contábeis..."
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="funded"
                type="checkbox"
                checked={form.funded_by_rental_profit}
                onChange={(e) => set('funded_by_rental_profit', e.target.checked)}
              />
              <label htmlFor="funded" className="text-sm text-gray-700">
                Custear com o lucro da locação (taxa de administração acumulada)
              </label>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : 'Criar Despesa'}
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
                  <th className="px-6 py-3">Centro</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Vencimento</th>
                  <th className="px-6 py-3">Origem</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-gray-100">
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-950">{expense.description}</p>
                      <p className="text-xs text-gray-500">{expense.categoryName}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{CENTER_LABEL[expense.center] ?? expense.center}</td>
                    <td className="px-6 py-4 font-semibold text-navy-950">
                      R$ {Number(expense.amount).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDateBR(expense.due_date)}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {expense.funded_by_rental_profit ? 'Lucro da locação' : 'Caixa geral'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[expense.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUS_LABEL[expense.status] ?? expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {expense.status !== 'paid' && (
                        <button
                          onClick={() => markAsPaid(expense.id)}
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

          {!loading && expenses.length === 0 && (
            <div className="p-12 text-center text-gray-600">Nenhuma despesa registrada ainda.</div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>
      </div>
    </div>
  );
}
