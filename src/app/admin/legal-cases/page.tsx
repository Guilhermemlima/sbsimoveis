'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BackToDashboardLink from '@/components/common/BackToDashboardLink';
import { Plus, X, Scale } from 'lucide-react';
import { formatDateBR } from '@/lib/format';
import type { LegalCaseType, LegalCaseStatus } from '@/types';

interface LegalCaseRow {
  id: string;
  title: string;
  case_type: LegalCaseType;
  status: LegalCaseStatus;
  process_number: string | null;
  deadline_date: string | null;
  responsibleName: string | null;
  properties?: { title: string; code: string } | null;
  created_at: string;
}

interface PropertyOption {
  id: string;
  title: string;
  code: string;
}

interface TenantOption {
  id: string;
  name: string;
}

interface OwnerOption {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
}

const CASE_TYPE_LABEL: Record<LegalCaseType, string> = {
  contract: 'Contrato',
  termination: 'Distrato',
  notification: 'Notificação Extrajudicial',
  collection: 'Cobrança Judicial',
  eviction: 'Ação de Despejo',
  lawsuit: 'Processo Judicial',
  other: 'Outro',
};

const STATUS_LABEL: Record<LegalCaseStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  awaiting_response: 'Aguardando Resposta',
  resolved: 'Resolvido',
  archived: 'Arquivado',
};

const STATUS_COLOR: Record<LegalCaseStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  awaiting_response: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-500',
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors text-sm';
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

export default function LegalCasesPage() {
  const [cases, setCases] = useState<LegalCaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<UserOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    case_type: 'notification' as LegalCaseType,
    property_id: '',
    tenant_id: '',
    owner_id: '',
    process_number: '',
    court: '',
    responsible_id: '',
    deadline_date: '',
    description: '',
  });

  const loadCases = () => {
    fetch('/api/admin/legal-cases')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCases(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCases();
    fetch('/api/realtor/properties')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []));
    fetch('/api/admin/tenants')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTenants(Array.isArray(data) ? data : []));
    fetch('/api/admin/owners')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOwners(Array.isArray(data) ? data : []));
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (!me) return;
        setIsAdmin(me.role === 'admin');
        if (me.role === 'admin') {
          fetch('/api/admin/users')
            .then((res) => (res.ok ? res.json() : []))
            .then((data) =>
              setStaffOptions(
                Array.isArray(data)
                  ? data.filter((u: UserOption) => u.role === 'admin' || u.role === 'legal')
                  : []
              )
            );
        }
      });
  }, []);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/admin/legal-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível abrir o caso.');
      return;
    }

    setForm({
      title: '',
      case_type: 'notification',
      property_id: '',
      tenant_id: '',
      owner_id: '',
      process_number: '',
      court: '',
      responsible_id: '',
      deadline_date: '',
      description: '',
    });
    setFormOpen(false);
    loadCases();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <BackToDashboardLink />
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Scale className="w-7 h-7 text-gold-400" />
              Módulo Jurídico
            </h1>
            <p className="text-navy-100">
              Contratos, distratos, notificações, cobranças judiciais, despejos e processos
            </p>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Novo Caso'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-md p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {error && (
              <div className="md:col-span-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="md:col-span-2">
              <label className={labelClass}>Título</label>
              <input
                required
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ex: Cobrança de aluguéis em atraso"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={form.case_type}
                onChange={(e) => set('case_type', e.target.value)}
                className={inputClass}
              >
                {Object.entries(CASE_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Imóvel</label>
              <select
                required
                value={form.property_id}
                onChange={(e) => set('property_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Inquilino (opcional)</label>
              <select value={form.tenant_id} onChange={(e) => set('tenant_id', e.target.value)} className={inputClass}>
                <option value="">Nenhum</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Proprietário (opcional)</label>
              <select value={form.owner_id} onChange={(e) => set('owner_id', e.target.value)} className={inputClass}>
                <option value="">Nenhum</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nº do processo</label>
              <input
                value={form.process_number}
                onChange={(e) => set('process_number', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Vara / Tribunal</label>
              <input value={form.court} onChange={(e) => set('court', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Prazo</label>
              <input
                type="date"
                value={form.deadline_date}
                onChange={(e) => set('deadline_date', e.target.value)}
                className={inputClass}
              />
            </div>
            {isAdmin && (
              <div>
                <label className={labelClass}>Responsável</label>
                <select
                  value={form.responsible_id}
                  onChange={(e) => set('responsible_id', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Eu mesmo</option>
                  {staffOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-3">
              <label className={labelClass}>Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : 'Abrir Caso'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-600">Carregando...</p>
          ) : cases.length === 0 ? (
            <p className="p-6 text-gray-600">Nenhum caso jurídico registrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Caso</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Imóvel</th>
                    <th className="px-6 py-3">Responsável</th>
                    <th className="px-6 py-3">Prazo</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.id} className="border-t border-gray-100">
                      <td className="px-6 py-4">
                        <Link href={`/admin/legal-cases/${c.id}`} className="font-medium text-navy-950 hover:text-gold-600">
                          {c.title}
                        </Link>
                        {c.process_number && <p className="text-xs text-gray-500">Nº {c.process_number}</p>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{CASE_TYPE_LABEL[c.case_type] ?? c.case_type}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {c.properties ? `${c.properties.title} · ${c.properties.code}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.responsibleName ?? '—'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {c.deadline_date ? formatDateBR(c.deadline_date) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[c.status]}`}
                        >
                          {STATUS_LABEL[c.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
