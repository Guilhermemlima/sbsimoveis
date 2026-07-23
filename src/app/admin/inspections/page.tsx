'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, ClipboardCheck } from 'lucide-react';
import type { Property, PropertyOwner, Tenant } from '@/types';
import { formatDateBR } from '@/lib/format';

interface Inspection {
  id: string;
  property_id: string;
  type: string;
  custom_type_label: string | null;
  status: string;
  scheduled_date: string | null;
  performed_date: string | null;
  ownerName: string | null;
  tenantName: string | null;
  properties?: { title: string; code: string };
}

const TYPE_LABEL: Record<string, string> = {
  entry: 'Entrada',
  exit: 'Saída',
  periodic: 'Periódica',
  emergency: 'Emergencial',
  maintenance: 'Manutenção',
  custom: 'Personalizada',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  in_progress: 'Em andamento',
  awaiting_signature: 'Aguardando assinatura',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  rescheduled: 'Reagendada',
  with_pending_issues: 'Com pendências',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  awaiting_signature: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
  with_pending_issues: 'bg-red-100 text-red-800',
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [form, setForm] = useState({
    property_id: '',
    owner_id: '',
    tenant_id: '',
    type: 'entry',
    custom_type_label: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
  });

  const loadInspections = () => {
    fetch('/api/admin/inspections')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setInspections(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInspections();
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

  const filteredInspections = useMemo(
    () => (typeFilter === 'all' ? inspections : inspections.filter((i) => i.type === typeFilter)),
    [inspections, typeFilter]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.property_id) {
      setError('Selecione um imóvel.');
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/admin/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível criar a vistoria.');
      return;
    }

    setForm({
      property_id: '',
      owner_id: '',
      tenant_id: '',
      type: 'entry',
      custom_type_label: '',
      scheduled_date: '',
      scheduled_time: '',
      notes: '',
    });
    setFormOpen(false);
    loadInspections();
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
              <ClipboardCheck className="w-7 h-7 text-gold-400" />
              Vistorias
            </h1>
            <p className="text-navy-100">Entrada, saída, periódica, emergencial e de manutenção</p>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Nova Vistoria'}
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

            <div>
              <label className={labelClass}>Tipo de vistoria</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputClass}>
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {form.type === 'custom' && (
              <div>
                <label className={labelClass}>Nome da vistoria personalizada</label>
                <input
                  value={form.custom_type_label}
                  onChange={(e) => set('custom_type_label', e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

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
              <label className={labelClass}>Data prevista</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => set('scheduled_date', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Horário</label>
              <input
                type="time"
                value={form.scheduled_time}
                onChange={(e) => set('scheduled_time', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Criando...' : 'Criar Vistoria'}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-semibold text-gray-700">Filtrar por tipo</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todos</option>
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
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
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Proprietário</th>
                  <th className="px-6 py-3">Inquilino</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map((inspection) => (
                  <tr
                    key={inspection.id}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => (window.location.href = `/admin/inspections/${inspection.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-950">{inspection.properties?.title}</p>
                      <p className="text-xs text-gray-500">{inspection.properties?.code}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {inspection.type === 'custom'
                        ? inspection.custom_type_label || 'Personalizada'
                        : TYPE_LABEL[inspection.type]}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{inspection.ownerName ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{inspection.tenantName ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {inspection.performed_date
                        ? formatDateBR(inspection.performed_date)
                        : inspection.scheduled_date
                          ? formatDateBR(inspection.scheduled_date)
                          : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[inspection.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUS_LABEL[inspection.status] ?? inspection.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredInspections.length === 0 && (
            <div className="p-12 text-center text-gray-600">Nenhuma vistoria registrada ainda.</div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>
      </div>
    </div>
  );
}
