'use client';

import { useEffect, useState } from 'react';
import BackToDashboardLink from '@/components/common/BackToDashboardLink';
import { UserPlus, Trash2, Pencil } from 'lucide-react';
import type { PropertyOwner, OwnerPaymentMethod } from '@/types';

const PAYMENT_METHOD_LABEL: Record<OwnerPaymentMethod, string> = {
  pix: 'PIX',
  ted: 'TED',
  doc: 'DOC',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  document_number: '',
  bank_name: '',
  bank_agency: '',
  bank_account: '',
  pix_key: '',
  payment_method: 'pix' as OwnerPaymentMethod,
  payment_beneficiary_name: '',
  preferred_payment_day: '',
};

export default function OwnersPage() {
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  const load = () => {
    fetch('/api/admin/owners')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOwners(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleNew = () => {
    const shouldOpen = editingId !== null || !formOpen;
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(shouldOpen);
  };

  const handleEdit = (owner: PropertyOwner) => {
    setEditingId(owner.id);
    setForm({
      name: owner.name,
      email: owner.email ?? '',
      phone: owner.phone ?? '',
      document_number: owner.document_number ?? '',
      bank_name: owner.bank_name ?? '',
      bank_agency: owner.bank_agency ?? '',
      bank_account: owner.bank_account ?? '',
      pix_key: owner.pix_key ?? '',
      payment_method: owner.payment_method ?? 'pix',
      payment_beneficiary_name: owner.payment_beneficiary_name ?? '',
      preferred_payment_day: owner.preferred_payment_day ? String(owner.preferred_payment_day) : '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const res = await fetch(editingId ? `/api/admin/owners/${editingId}` : '/api/admin/owners', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error || 'Não foi possível salvar o proprietário.');
      return;
    }

    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este proprietário?')) return;
    const res = await fetch(`/api/admin/owners/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setOwners((prev) => prev.filter((o) => o.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Não foi possível remover.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <BackToDashboardLink />
          <h1 className="text-3xl font-bold mb-2">Proprietários</h1>
          <p className="text-navy-100">Cadastro de proprietários para contratos de locação</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-end mb-6">
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-2 px-5 py-3 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            {formOpen ? 'Cancelar' : 'Novo Proprietário'}
          </button>
        </div>

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-md p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <h2 className="md:col-span-2 text-lg font-bold text-navy-950">
              {editingId ? 'Editar Proprietário' : 'Novo Proprietário'}
            </h2>
            {formError && (
              <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
              <input
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">CPF/CNPJ</label>
              <input
                value={form.document_number}
                onChange={(e) => set('document_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone</label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(42) 99999-9999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
              <h3 className="text-sm font-bold text-navy-950 mb-1">Forma de Pagamento</h3>
              <p className="text-xs text-gray-500">Dados usados nos repasses ao proprietário</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Forma de Pagamento</label>
              <select
                value={form.payment_method}
                onChange={(e) => set('payment_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              >
                <option value="pix">PIX</option>
                <option value="ted">TED</option>
                <option value="doc">DOC</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Melhor dia para pagamento</label>
              <input
                type="number"
                min="1"
                max="28"
                value={form.preferred_payment_day}
                onChange={(e) => set('preferred_payment_day', e.target.value)}
                placeholder="Ex: 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Favorecido</label>
              <input
                value={form.payment_beneficiary_name}
                onChange={(e) => set('payment_beneficiary_name', e.target.value)}
                placeholder="Nome do titular da conta/chave, se diferente do proprietário"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Chave PIX</label>
              <input
                value={form.pix_key}
                onChange={(e) => set('pix_key', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Banco</label>
              <input
                value={form.bank_name}
                onChange={(e) => set('bank_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Agência</label>
              <input
                value={form.bank_agency}
                onChange={(e) => set('bank_agency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Conta</label>
              <input
                value={form.bank_account}
                onChange={(e) => set('bank_account', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Proprietário'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-600">Carregando...</p>
          ) : owners.length === 0 ? (
            <p className="p-6 text-gray-600">Nenhum proprietário cadastrado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Contato</th>
                  <th className="px-6 py-3">Pagamento</th>
                  <th className="px-6 py-3">Melhor dia</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner) => (
                  <tr key={owner.id} className="border-t border-gray-100">
                    <td className="px-6 py-4 font-medium text-navy-950">{owner.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {owner.phone || owner.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-navy-50 text-navy-900">
                        {PAYMENT_METHOD_LABEL[owner.payment_method ?? 'pix']}
                      </span>
                      {owner.payment_method === 'pix' && owner.pix_key && (
                        <span className="ml-2 text-xs text-gray-500">{owner.pix_key}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {owner.preferred_payment_day ? `Dia ${owner.preferred_payment_day}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleEdit(owner)}
                          className="inline-flex items-center gap-1 text-navy-900 hover:text-gold-600 font-semibold"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(owner.id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
