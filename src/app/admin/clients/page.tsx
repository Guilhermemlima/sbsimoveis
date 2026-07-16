'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus, ShieldCheck, ShieldOff, Power } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const loadClients = () => {
    fetch('/api/admin/clients')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error || 'Não foi possível criar o cliente.');
      return;
    }

    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setFormOpen(false);
    loadClients();
  };

  const toggleActive = async (client: Client) => {
    await fetch(`/api/admin/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !client.is_active }),
    });
    loadClients();
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
          <h1 className="text-3xl font-bold mb-2">Clientes</h1>
          <p className="text-navy-100">
            Ainda não existe cadastro público de cliente — crie logins manualmente aqui
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            {formOpen ? 'Cancelar' : 'Novo Cliente'}
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
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(42) 99999-9999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha provisória
              </label>
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mín. 6 caracteres"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Criando...' : 'Criar Cliente'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-600">Carregando...</p>
          ) : clients.length === 0 ? (
            <p className="p-6 text-gray-600">Nenhum cliente cadastrado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">E-mail</th>
                  <th className="px-6 py-3">Telefone</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-t border-gray-100">
                    <td className="px-6 py-4 font-medium text-navy-950">{client.name}</td>
                    <td className="px-6 py-4 text-gray-600">{client.email}</td>
                    <td className="px-6 py-4 text-gray-600">{client.phone ?? '—'}</td>
                    <td className="px-6 py-4">
                      {client.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded-full text-xs font-semibold">
                          <ShieldOff className="w-3 h-3" /> Desativado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleActive(client)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <Power className="w-3 h-3" />
                        {client.is_active ? 'Desativar' : 'Reativar'}
                      </button>
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
