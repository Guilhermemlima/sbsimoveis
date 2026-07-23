'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, FileEdit } from 'lucide-react';
import type { Tenant, PropertyOwner } from '@/types';
import { formatDateBR } from '@/lib/format';

interface LeaseRow {
  id: string;
  property_id: string;
  owner_id: string;
  tenant_id: string;
  rent_value: number;
  end_date: string;
  admin_fee_percentage: number;
  due_day: number;
  deposit_value: number;
  water_responsible: string;
  energy_responsible: string;
  iptu_responsible: string;
  insurance_responsible: string;
  condo_responsible: string;
  properties?: { title: string; code: string };
  ownerName?: string;
  tenantName?: string;
}

interface Template {
  id: string;
  type: string;
  name: string;
}

interface AmendmentRow {
  id: string;
  lease_contract_id: string;
  type: string;
  version: number;
  title: string;
  status: string;
  effective_date: string | null;
  created_at: string;
  lease_contracts?: { properties?: { title: string; code: string } };
}

const TYPE_LABEL: Record<string, string> = {
  rent_adjustment: 'Reajuste de Aluguel',
  term_extension: 'Prorrogação de Prazo',
  responsibility_change: 'Alteração de Responsabilidades',
  tenant_change: 'Substituição de Inquilino',
  owner_change: 'Substituição de Proprietário',
  other: 'Outro',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  pending_signature: 'Aguardando assinatura',
  signed: 'Assinado',
  cancelled: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_signature: 'bg-yellow-100 text-yellow-800',
  signed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const RESPONSIBLE_OPTIONS = [
  { value: 'tenant', label: 'Inquilino' },
  { value: 'owner', label: 'Proprietário' },
  { value: 'agency', label: 'Imobiliária' },
  { value: 'split', label: 'Dividido' },
];

const responsibleFields: { key: string; label: string }[] = [
  { key: 'water_responsible', label: 'Água' },
  { key: 'energy_responsible', label: 'Energia' },
  { key: 'iptu_responsible', label: 'IPTU' },
  { key: 'insurance_responsible', label: 'Seguro' },
  { key: 'condo_responsible', label: 'Condomínio' },
];

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

function getQueryParam(name: string): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(name) || '';
}

export default function AmendmentsPage() {
  const [amendments, setAmendments] = useState<AmendmentRow[]>([]);
  const [leases, setLeases] = useState<LeaseRow[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(() => !!getQueryParam('lease'));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [leaseId, setLeaseId] = useState(() => getQueryParam('lease'));
  const [type, setType] = useState('rent_adjustment');
  const [templateId, setTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [newRentValue, setNewRentValue] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newTenantId, setNewTenantId] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [responsibilityChanges, setResponsibilityChanges] = useState<Record<string, string>>({});
  const [customContent, setCustomContent] = useState('');

  const loadAmendments = () => {
    fetch('/api/admin/amendments')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAmendments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAmendments();
    fetch('/api/admin/leases')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLeases(Array.isArray(data) ? data : []));
    fetch('/api/admin/amendment-templates')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTemplates(Array.isArray(data) ? data : []));
    fetch('/api/admin/tenants')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTenants(Array.isArray(data) ? data : []));
    fetch('/api/admin/owners')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOwners(Array.isArray(data) ? data : []));
  }, []);

  const selectedLease = useMemo(() => leases.find((l) => l.id === leaseId), [leases, leaseId]);

  const applyTypeDefaults = (nextType: string, propertyCode?: string) => {
    const match = templates.find((t) => t.type === nextType);
    setTemplateId(match?.id ?? '');
    setTitle(match ? `${match.name} — ${propertyCode ?? selectedLease?.properties?.code ?? ''}` : '');
  };

  const resetForm = () => {
    setLeaseId('');
    setType('rent_adjustment');
    setTitle('');
    setEffectiveDate('');
    setNewRentValue('');
    setNewEndDate('');
    setNewTenantId('');
    setNewOwnerId('');
    setResponsibilityChanges({});
    setCustomContent('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!leaseId || !title.trim()) {
      setError('Selecione o contrato e informe o título.');
      return;
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (type === 'rent_adjustment') {
      if (!newRentValue) {
        setError('Informe o novo valor do aluguel.');
        return;
      }
      changes.rent_value = { from: selectedLease?.rent_value, to: Number(newRentValue) };
    } else if (type === 'term_extension') {
      if (!newEndDate) {
        setError('Informe a nova data de término.');
        return;
      }
      changes.end_date = { from: selectedLease?.end_date, to: newEndDate };
    } else if (type === 'tenant_change') {
      if (!newTenantId) {
        setError('Selecione o novo inquilino.');
        return;
      }
      changes.tenant_id = { from: selectedLease?.tenant_id, to: newTenantId };
    } else if (type === 'owner_change') {
      if (!newOwnerId) {
        setError('Selecione o novo proprietário.');
        return;
      }
      changes.owner_id = { from: selectedLease?.owner_id, to: newOwnerId };
    } else if (type === 'responsibility_change') {
      for (const field of responsibleFields) {
        const newValue = responsibilityChanges[field.key];
        if (newValue && selectedLease && newValue !== (selectedLease as unknown as Record<string, string>)[field.key]) {
          changes[field.key] = { from: (selectedLease as unknown as Record<string, string>)[field.key], to: newValue };
        }
      }
      if (Object.keys(changes).length === 0) {
        setError('Altere ao menos uma responsabilidade.');
        return;
      }
    }

    setSubmitting(true);
    const res = await fetch('/api/admin/amendments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lease_contract_id: leaseId,
        type,
        template_id: type === 'other' ? null : templateId,
        content: type === 'other' ? customContent : undefined,
        title,
        effective_date: effectiveDate || null,
        changes,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível criar o aditivo.');
      return;
    }

    const created = await res.json();
    window.location.href = `/admin/amendments/${created.id}`;
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
              <FileEdit className="w-7 h-7 text-gold-400" />
              Aditivos Contratuais
            </h1>
            <p className="text-navy-100">Reajustes, prorrogações e alterações — sem nunca sobrescrever o contrato original</p>
          </div>
          <button
            onClick={() => {
              setFormOpen((v) => !v);
              if (formOpen) resetForm();
            }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Novo Aditivo'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {formOpen && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 mb-8 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Contrato</label>
                <select
                  required
                  value={leaseId}
                  onChange={(e) => {
                    const nextLeaseId = e.target.value;
                    setLeaseId(nextLeaseId);
                    const lease = leases.find((l) => l.id === nextLeaseId);
                    applyTypeDefaults(type, lease?.properties?.code);
                  }}
                  className={inputClass}
                >
                  <option value="">Selecione um contrato</option>
                  {leases.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.properties?.title} · {l.properties?.code} — {l.tenantName ?? l.tenant_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Tipo de aditivo</label>
                <select
                  value={type}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setType(nextType);
                    applyTypeDefaults(nextType);
                  }}
                  className={inputClass}
                >
                  {Object.entries(TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedLease && type === 'rent_adjustment' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Aluguel atual</label>
                  <input disabled value={`R$ ${Number(selectedLease.rent_value).toFixed(2)}`} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Novo valor do aluguel</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={newRentValue}
                    onChange={(e) => setNewRentValue(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {selectedLease && type === 'term_extension' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Término atual</label>
                  <input disabled value={formatDateBR(selectedLease.end_date)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Novo término</label>
                  <input
                    required
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {selectedLease && type === 'tenant_change' && (
              <div>
                <label className={labelClass}>Novo inquilino</label>
                <select required value={newTenantId} onChange={(e) => setNewTenantId(e.target.value)} className={inputClass}>
                  <option value="">Selecione</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedLease && type === 'owner_change' && (
              <div>
                <label className={labelClass}>Novo proprietário</label>
                <select required value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)} className={inputClass}>
                  <option value="">Selecione</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedLease && type === 'responsibility_change' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {responsibleFields.map((field) => (
                  <div key={field.key}>
                    <label className={labelClass}>
                      {field.label} (atual: {RESPONSIBLE_OPTIONS.find((o) => o.value === (selectedLease as unknown as Record<string, string>)[field.key])?.label})
                    </label>
                    <select
                      value={responsibilityChanges[field.key] ?? ''}
                      onChange={(e) =>
                        setResponsibilityChanges((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className={inputClass}
                    >
                      <option value="">Manter</option>
                      {RESPONSIBLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {type === 'other' && (
              <div>
                <label className={labelClass}>Conteúdo do aditivo</label>
                <textarea
                  required
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows={6}
                  className={inputClass}
                  placeholder="Descreva as alterações contratuais acordadas..."
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Título</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Data de vigência</label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Criando...' : 'Criar Rascunho'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Imóvel</th>
                  <th className="px-6 py-3">Título</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Versão</th>
                  <th className="px-6 py-3">Vigência</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {amendments.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => (window.location.href = `/admin/amendments/${a.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-950">{a.lease_contracts?.properties?.title}</p>
                      <p className="text-xs text-gray-500">{a.lease_contracts?.properties?.code}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{a.title}</td>
                    <td className="px-6 py-4 text-gray-600">{TYPE_LABEL[a.type] ?? a.type}</td>
                    <td className="px-6 py-4 text-gray-600">v{a.version}</td>
                    <td className="px-6 py-4 text-gray-600">{a.effective_date ? formatDateBR(a.effective_date) : '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[a.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && amendments.length === 0 && (
            <div className="p-12 text-center text-gray-600">Nenhum aditivo registrado.</div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>
      </div>
    </div>
  );
}
