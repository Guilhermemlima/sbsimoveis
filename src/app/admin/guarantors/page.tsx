'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BackToDashboardLink from '@/components/common/BackToDashboardLink';
import { UserPlus, Trash2, Pencil, FileText } from 'lucide-react';
import type { Guarantor } from '@/types';

const emptyForm = {
  name: '',
  document_number: '',
  rg: '',
  address: '',
  phone: '',
  email: '',
  notes: '',
};

export default function GuarantorsPage() {
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  const load = () => {
    fetch('/api/admin/guarantors')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setGuarantors(Array.isArray(data) ? data : []))
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

  const handleEdit = (guarantor: Guarantor) => {
    setEditingId(guarantor.id);
    setForm({
      name: guarantor.name,
      document_number: guarantor.document_number ?? '',
      rg: guarantor.rg ?? '',
      address: guarantor.address ?? '',
      phone: guarantor.phone ?? '',
      email: guarantor.email ?? '',
      notes: guarantor.notes ?? '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const res = await fetch(editingId ? `/api/admin/guarantors/${editingId}` : '/api/admin/guarantors', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error || 'Não foi possível salvar o fiador.');
      return;
    }

    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este fiador?')) return;
    const res = await fetch(`/api/admin/guarantors/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setGuarantors((prev) => prev.filter((g) => g.id !== id));
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
          <h1 className="text-3xl font-bold mb-2">Fiadores</h1>
          <p className="text-navy-100">Cadastro de fiadores para contratos de locação</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-end mb-6">
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-2 px-5 py-3 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            {formOpen ? 'Cancelar' : 'Novo Fiador'}
          </button>
        </div>

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-md p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <h2 className="md:col-span-2 text-lg font-bold text-navy-950">
              {editingId ? 'Editar Fiador' : 'Novo Fiador'}
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">CPF</label>
              <input
                value={form.document_number}
                onChange={(e) => set('document_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">RG</label>
              <input
                value={form.rg}
                onChange={(e) => set('rg', e.target.value)}
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Endereço</label>
              <input
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Fiador'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-600">Carregando...</p>
          ) : guarantors.length === 0 ? (
            <p className="p-6 text-gray-600">Nenhum fiador cadastrado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">CPF</th>
                  <th className="px-6 py-3">Contato</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {guarantors.map((guarantor) => (
                  <tr key={guarantor.id} className="border-t border-gray-100">
                    <td className="px-6 py-4 font-medium text-navy-950">
                      <Link href={`/admin/guarantors/${guarantor.id}`} className="hover:text-gold-600">
                        {guarantor.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{guarantor.document_number || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {guarantor.phone || guarantor.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/guarantors/${guarantor.id}`}
                          className="inline-flex items-center gap-1 text-navy-900 hover:text-gold-600 font-semibold"
                        >
                          <FileText className="w-3 h-3" />
                          Documentos
                        </Link>
                        <button
                          onClick={() => handleEdit(guarantor)}
                          className="inline-flex items-center gap-1 text-navy-900 hover:text-gold-600 font-semibold"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(guarantor.id)}
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
