'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BackToDashboardLink from '@/components/common/BackToDashboardLink';
import { UserPlus, ShieldCheck, ShieldOff, Power, FileText, Users, Home, ShoppingBag, Trash2 } from 'lucide-react';

type PartyType = 'buyer' | 'tenant' | 'owner';

interface Person {
  key: string;
  id: string;
  type: PartyType;
  name: string;
  email: string | null;
  phone: string | null;
  document_number: string | null;
  is_active: boolean | null;
  detailHref: string;
  created_at: string;
}

const TYPE_LABEL: Record<PartyType, string> = {
  buyer: 'Comprador',
  tenant: 'Inquilino',
  owner: 'Proprietário',
};

const TYPE_BADGE: Record<PartyType, string> = {
  buyer: 'bg-purple-100 text-purple-800',
  tenant: 'bg-blue-100 text-blue-800',
  owner: 'bg-emerald-100 text-emerald-800',
};

const TYPE_ICON: Record<PartyType, typeof Users> = {
  buyer: ShoppingBag,
  tenant: Users,
  owner: Home,
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  document_number: '',
  rg: '',
  address: '',
  notes: '',
  password: '',
};

export default function AdminClientsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | PartyType>('all');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [types, setTypes] = useState<Record<PartyType, boolean>>({
    buyer: false,
    tenant: false,
    owner: false,
  });

  const load = () => {
    fetch('/api/admin/people')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPeople(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const counts = useMemo(
    () => ({
      all: people.length,
      buyer: people.filter((p) => p.type === 'buyer').length,
      tenant: people.filter((p) => p.type === 'tenant').length,
      owner: people.filter((p) => p.type === 'owner').length,
    }),
    [people]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return people.filter((p) => {
      if (filter !== 'all' && p.type !== filter) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        (p.email ?? '').toLowerCase().includes(term) ||
        (p.phone ?? '').toLowerCase().includes(term) ||
        (p.document_number ?? '').toLowerCase().includes(term)
      );
    });
  }, [people, filter, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const selected = (Object.keys(types) as PartyType[]).filter((t) => types[t]);
    if (selected.length === 0) {
      setFormError('Selecione ao menos um tipo: comprador, inquilino ou proprietário.');
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/admin/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, types: selected }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error || 'Não foi possível cadastrar.');
      return;
    }

    setForm(emptyForm);
    setTypes({ buyer: false, tenant: false, owner: false });
    setFormOpen(false);
    load();
  };

  const toggleActive = async (person: Person) => {
    await fetch(`/api/admin/clients/${person.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !person.is_active }),
    });
    load();
  };

  /**
   * Remove proprietário ou inquilino. A API recusa quando a pessoa tem
   * contrato vinculado, para não quebrar o histórico — nesse caso o motivo
   * é mostrado ao usuário.
   */
  const removePerson = async (person: Person) => {
    const rotulo = TYPE_LABEL[person.type].toLowerCase();
    if (!confirm(`Remover o ${rotulo} "${person.name}"? Esta ação não pode ser desfeita.`)) return;

    const endpoint = person.type === 'owner' ? 'owners' : 'tenants';
    const res = await fetch(`/api/admin/${endpoint}/${person.id}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Não foi possível remover.');
      return;
    }
    load();
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold-500';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <BackToDashboardLink />
            <h1 className="text-3xl font-bold mb-2">Clientes</h1>
            <p className="text-navy-100">
              Base única de pessoas — compradores, inquilinos e proprietários. Clique em um nome para ver
              os dados e anexar documentos.
            </p>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            {formOpen ? 'Cancelar' : 'Novo Cliente'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {formOpen && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl shadow-md p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {formError && (
              <div className="md:col-span-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <div className="md:col-span-3">
              <label className={labelClass}>Este cliente é (pode marcar mais de um)</label>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(TYPE_LABEL) as PartyType[]).map((t) => {
                  const Icon = TYPE_ICON[t];
                  return (
                    <label
                      key={t}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50"
                    >
                      <input
                        type="checkbox"
                        checked={types[t]}
                        onChange={(e) => setTypes((prev) => ({ ...prev, [t]: e.target.checked }))}
                      />
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{TYPE_LABEL[t]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Nome</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>CPF/CNPJ</label>
              <input
                value={form.document_number}
                onChange={(e) => set('document_number', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>RG</label>
              <input value={form.rg} onChange={(e) => set('rg', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>
                E-mail {types.buyer && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                required={types.buyer}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(42) 99999-9999"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Endereço</label>
              <input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} />
            </div>

            {types.buyer && (
              <div className="md:col-span-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className={labelClass}>
                  Senha provisória do portal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Compradores ganham login no portal do cliente — por isso e-mail e senha são obrigatórios.
                </p>
              </div>
            )}

            <div className="md:col-span-3">
              <label className={labelClass}>Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Cadastrando...' : 'Cadastrar Cliente'}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {([['all', 'Todos'], ...(Object.entries(TYPE_LABEL) as [PartyType, string][])] as [
              'all' | PartyType,
              string,
            ][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === value
                    ? 'bg-navy-950 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
                <span className="ml-1.5 text-xs opacity-70">({counts[value]})</span>
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou CPF..."
            className="flex-1 min-w-[240px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold-500"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-600">Carregando...</p>
          ) : visible.length === 0 ? (
            <p className="p-6 text-gray-600">
              {people.length === 0
                ? 'Nenhum cliente cadastrado ainda.'
                : 'Nenhum cliente encontrado com esses filtros.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Nome</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">CPF/CNPJ</th>
                    <th className="px-6 py-3">Contato</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((person) => {
                    const Icon = TYPE_ICON[person.type];
                    return (
                      <tr key={person.key} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-navy-950">
                          <Link href={person.detailHref} className="hover:text-gold-600 hover:underline">
                            {person.name}
                          </Link>
                          {person.type === 'buyer' && person.is_active === false && (
                            <span className="ml-2 inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                              <ShieldOff className="w-3 h-3" /> Desativado
                            </span>
                          )}
                          {person.type === 'buyer' && person.is_active === true && (
                            <span className="ml-2 inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                              <ShieldCheck className="w-3 h-3" /> Login ativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_BADGE[person.type]}`}
                          >
                            <Icon className="w-3 h-3" />
                            {TYPE_LABEL[person.type]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{person.document_number ?? '—'}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {person.email && <p>{person.email}</p>}
                          {person.phone && <p className="text-xs text-gray-500">{person.phone}</p>}
                          {!person.email && !person.phone && '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={person.detailHref}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              Documentos
                            </Link>
                            {person.type === 'buyer' ? (
                              <button
                                onClick={() => toggleActive(person)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                                title="Comprador tem login no portal, por isso é desativado em vez de excluído"
                              >
                                <Power className="w-3 h-3" />
                                {person.is_active ? 'Desativar' : 'Reativar'}
                              </button>
                            ) : (
                              <button
                                onClick={() => removePerson(person)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remover
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
