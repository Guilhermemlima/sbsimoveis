'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Trash2, KeyRound, ShieldCheck } from 'lucide-react';
import type { Tenant } from '@/types';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginTenantId, setLoginTenantId] = useState<string | null>(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    document_number: '',
  });

  const load = () => {
    fetch('/api/admin/tenants')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTenants(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const res = await fetch('/api/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error || 'Não foi possível cadastrar o inquilino.');
      return;
    }

    setForm({ name: '', email: '', phone: '', document_number: '' });
    setFormOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este inquilino?')) return;
    const res = await fetch(`/api/admin/tenants/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTenants((prev) => prev.filter((t) => t.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Não foi possível remover.');
    }
  };

  const handleCreateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginTenantId) return;
    setLoginError('');
    setLoginSubmitting(true);

    const res = await fetch(`/api/admin/tenants/${loginTenantId}/create-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: loginPassword }),
    });

    setLoginSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error || 'Não foi possível criar o login.');
      return;
    }

    setLoginTenantId(null);
    setLoginPassword('');
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Inquilinos</h1>
          <p className="text-navy-100">Cadastro de inquilinos e acesso ao portal</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            {formOpen ? 'Cancelar' : 'Novo Inquilino'}
          </button>
        </div>

        {formOpen && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl shadow-md p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E-mail (necessário para criar login do portal)
              </label>
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

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : 'Cadastrar Inquilino'}
              </button>
            </div>
          </form>
        )}

        {loginTenantId && (
          <form
            onSubmit={handleCreateLogin}
            className="bg-white rounded-xl shadow-md p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {loginError && (
              <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha provisória para o portal do inquilino
              </label>
              <input
                required
                minLength={6}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Mín. 6 caracteres"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={loginSubmitting}
                className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {loginSubmitting ? 'Criando...' : 'Criar Login'}
              </button>
              <button
                type="button"
                onClick={() => setLoginTenantId(null)}
                className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-600">Carregando...</p>
          ) : tenants.length === 0 ? (
            <p className="p-6 text-gray-600">Nenhum inquilino cadastrado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Contato</th>
                  <th className="px-6 py-3">CPF</th>
                  <th className="px-6 py-3">Portal</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-t border-gray-100">
                    <td className="px-6 py-4 font-medium text-navy-950">{tenant.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {tenant.phone || tenant.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{tenant.document_number || '—'}</td>
                    <td className="px-6 py-4">
                      {tenant.user_id ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Login ativo
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sem login</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {!tenant.user_id && (
                          <button
                            onClick={() => {
                              setLoginTenantId(tenant.id);
                              setLoginError('');
                            }}
                            className="inline-flex items-center gap-1 text-navy-900 hover:text-gold-600 font-semibold"
                          >
                            <KeyRound className="w-3 h-3" />
                            Criar Login
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(tenant.id)}
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
