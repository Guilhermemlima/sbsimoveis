'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Wrench } from 'lucide-react';
import type { Property, PropertyOwner, Tenant } from '@/types';
import { formatDateBR } from '@/lib/format';

interface MaintenanceRequestRow {
  id: string;
  property_id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  ownerName: string | null;
  tenantName: string | null;
  created_at: string;
  properties?: { title: string; code: string };
}

const CATEGORY_LABEL: Record<string, string> = {
  plumbing: 'Hidráulica',
  electrical: 'Elétrica',
  structural: 'Estrutural',
  appliance: 'Eletrodoméstico',
  hvac: 'Ar-condicionado/Climatização',
  pest_control: 'Controle de pragas',
  painting: 'Pintura',
  locksmith: 'Chaveiro/Fechadura',
  other: 'Outro',
};

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const STATUS_LABEL: Record<string, string> = {
  requested: 'Solicitada',
  under_review: 'Em análise',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

const STATUS_COLOR: Record<string, string> = {
  requested: 'bg-gray-100 text-gray-700',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequestRow[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState({
    property_id: '',
    owner_id: '',
    tenant_id: '',
    title: '',
    description: '',
    category: 'other',
    priority: 'normal',
    estimated_cost: '',
  });

  const loadRequests = () => {
    fetch('/api/admin/maintenance')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
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

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const filteredRequests = useMemo(
    () => (statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter)),
    [requests, statusFilter]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.property_id || !form.title.trim()) {
      setError('Selecione um imóvel e informe o título.');
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/admin/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível criar a solicitação.');
      return;
    }

    setForm({
      property_id: '',
      owner_id: '',
      tenant_id: '',
      title: '',
      description: '',
      category: 'other',
      priority: 'normal',
      estimated_cost: '',
    });
    setFormOpen(false);
    loadRequests();
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
              <Wrench className="w-7 h-7 text-gold-400" />
              Manutenção
            </h1>
            <p className="text-navy-100">Solicitações, aprovações e responsabilidade financeira</p>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Nova Solicitação'}
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
              <label className={labelClass}>Imóvel</label>
              <select
                required
                value={form.property_id}
                onChange={(e) => set('property_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione um imóvel</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Título</label>
              <input
                required
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ex: Vazamento no banheiro social"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Categoria</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputClass}>
                {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Prioridade</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputClass}>
                {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Proprietário (opcional)</label>
              <select
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
              <label className={labelClass}>Inquilino (opcional)</label>
              <select
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
              <label className={labelClass}>Custo estimado (opcional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.estimated_cost}
                onChange={(e) => set('estimated_cost', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Criando...' : 'Criar Solicitação'}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-semibold text-gray-700">Filtrar por status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todos</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Imóvel</th>
                  <th className="px-6 py-3">Título</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Prioridade</th>
                  <th className="px-6 py-3">Custo</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => (window.location.href = `/admin/maintenance/${r.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-950">{r.properties?.title}</p>
                      <p className="text-xs text-gray-500">{r.properties?.code}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.title}</td>
                    <td className="px-6 py-4 text-gray-600">{CATEGORY_LABEL[r.category] ?? r.category}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLOR[r.priority] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {PRIORITY_LABEL[r.priority] ?? r.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {r.actual_cost != null
                        ? `R$ ${Number(r.actual_cost).toFixed(2)}`
                        : r.estimated_cost != null
                          ? `~R$ ${Number(r.estimated_cost).toFixed(2)}`
                          : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDateBR(r.created_at.slice(0, 10))}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[r.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredRequests.length === 0 && (
            <div className="p-12 text-center text-gray-600">Nenhuma solicitação de manutenção registrada.</div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>
      </div>
    </div>
  );
}
