'use client';

import { useEffect, useMemo, useState } from 'react';
import BackToDashboardLink from '@/components/common/BackToDashboardLink';
import { Plus, X, ChevronLeft, ChevronRight, Phone, Mail, Clock, XCircle } from 'lucide-react';
import { formatDateBR } from '@/lib/format';
import type { LeadStatus, LeadStatusHistory } from '@/types';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  source: string;
  status: LeadStatus;
  internal_notes: string | null;
  property_id: string | null;
  realtor_id: string | null;
  realtorName: string | null;
  created_at: string;
  updated_at: string;
  properties?: { title: string; code: string } | null;
}

interface LeadDetail extends Lead {
  history: LeadStatusHistory[];
}

interface PropertyOption {
  id: string;
  title: string;
  code: string;
}

interface RealtorOption {
  id: string;
  name: string;
}

const FUNNEL_STAGES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Novo Lead' },
  { value: 'contacted', label: 'Primeiro Contato' },
  { value: 'visit_scheduled', label: 'Visita Agendada' },
  { value: 'proposal_sent', label: 'Proposta Enviada' },
  { value: 'negotiating', label: 'Negociação' },
  { value: 'contract', label: 'Contrato' },
  { value: 'sold', label: 'Concluído' },
];

const LOST_STAGE: { value: LeadStatus; label: string } = { value: 'lost', label: 'Perdido' };

const SOURCE_LABEL: Record<string, string> = {
  website: 'Site',
  whatsapp: 'WhatsApp',
  phone: 'Telefone',
  instagram: 'Instagram',
  facebook: 'Facebook',
  email: 'E-mail',
  referral: 'Indicação',
  other: 'Outro',
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors text-sm';
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

export default function LeadsCrmPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [realtorOptions, setRealtorOptions] = useState<RealtorOption[]>([]);
  const [canAssign, setCanAssign] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'website',
    property_id: '',
    realtor_id: '',
    internal_notes: '',
  });

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [moving, setMoving] = useState(false);

  const loadLeads = () => {
    fetch('/api/admin/leads-crm')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeads();
    fetch('/api/realtor/properties')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []));
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (!me) return;
        const assign = me.role === 'admin' || (me.permissions ?? []).includes('manage_leads');
        setCanAssign(assign);
        if (assign) {
          fetch('/api/admin/realtors')
            .then((res) => (res.ok ? res.json() : []))
            .then((data) =>
              setRealtorOptions(
                Array.isArray(data) ? data.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })) : []
              )
            );
        }
      });
  }, []);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const columns = useMemo(() => {
    const map = new Map<LeadStatus, Lead[]>();
    [...FUNNEL_STAGES, LOST_STAGE].forEach((s) => map.set(s.value, []));
    leads.forEach((lead) => {
      const list = map.get(lead.status) ?? map.get('lost')!;
      list.push(lead);
    });
    return map;
  }, [leads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/admin/leads-crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível cadastrar o lead.');
      return;
    }

    setForm({ name: '', phone: '', email: '', source: 'website', property_id: '', realtor_id: '', internal_notes: '' });
    setFormOpen(false);
    loadLeads();
  };

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    fetch(`/api/admin/leads-crm/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDetail(data))
      .finally(() => setDetailLoading(false));
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  const moveStage = async (id: string, newStatus: LeadStatus) => {
    setMoving(true);
    const res = await fetch(`/api/admin/leads-crm/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setMoving(false);
    if (res.ok) {
      loadLeads();
      if (detailId === id) openDetail(id);
    }
  };

  const orderedStageValues = [...FUNNEL_STAGES.map((s) => s.value), LOST_STAGE.value];

  const adjacentStage = (current: LeadStatus, direction: 1 | -1): LeadStatus | null => {
    const funnelOnly = FUNNEL_STAGES.map((s) => s.value);
    const idx = funnelOnly.indexOf(current);
    if (idx === -1) return null;
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= funnelOnly.length) return null;
    return funnelOnly[nextIdx];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <BackToDashboardLink />
            <h1 className="text-3xl font-bold mb-2">Funil de Leads (CRM)</h1>
            <p className="text-navy-100">Acompanhe cada lead do primeiro contato até o fechamento</p>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Novo Lead'}
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
            <div>
              <label className={labelClass}>Nome</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input
                required
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(42) 99999-9999"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Origem</label>
              <select value={form.source} onChange={(e) => set('source', e.target.value)} className={inputClass}>
                {Object.entries(SOURCE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Imóvel de interesse</label>
              <select
                value={form.property_id}
                onChange={(e) => set('property_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Nenhum</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.code}
                  </option>
                ))}
              </select>
            </div>
            {canAssign && (
              <div>
                <label className={labelClass}>Corretor responsável</label>
                <select
                  value={form.realtor_id}
                  onChange={(e) => set('realtor_id', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Eu mesmo</option>
                  {realtorOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-3">
              <label className={labelClass}>Observações</label>
              <textarea
                value={form.internal_notes}
                onChange={(e) => set('internal_notes', e.target.value)}
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
                {submitting ? 'Salvando...' : 'Cadastrar Lead'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-gray-600">Carregando...</p>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {[...FUNNEL_STAGES, LOST_STAGE].map((stage) => {
                const stageLeads = columns.get(stage.value) ?? [];
                const isLost = stage.value === 'lost';
                return (
                  <div
                    key={stage.value}
                    className={`w-72 flex-shrink-0 rounded-xl ${isLost ? 'bg-red-50' : 'bg-gray-100'} p-3`}
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className={`text-sm font-bold ${isLost ? 'text-red-700' : 'text-navy-950'}`}>
                        {stage.label}
                      </h3>
                      <span className="text-xs font-semibold text-gray-500 bg-white rounded-full px-2 py-0.5">
                        {stageLeads.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => openDetail(lead.id)}
                          className="bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <p className="font-semibold text-navy-950 text-sm">{lead.name}</p>
                          {lead.properties && (
                            <p className="text-xs text-gray-500 truncate">
                              {lead.properties.title} · {lead.properties.code}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </div>
                          {lead.realtorName && (
                            <p className="text-xs text-gray-400 mt-1">Corretor: {lead.realtorName}</p>
                          )}
                          {!isLost && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const prev = adjacentStage(lead.status, -1);
                                  if (prev) moveStage(lead.id, prev);
                                }}
                                disabled={!adjacentStage(lead.status, -1) || moving}
                                className="p-1 text-gray-400 hover:text-navy-900 disabled:opacity-20"
                                aria-label="Estágio anterior"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveStage(lead.id, 'lost');
                                }}
                                disabled={moving}
                                className="p-1 text-gray-400 hover:text-red-600"
                                aria-label="Marcar como perdido"
                                title="Marcar como perdido"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const next = adjacentStage(lead.status, 1);
                                  if (next) moveStage(lead.id, next);
                                }}
                                disabled={!adjacentStage(lead.status, 1) || moving}
                                className="p-1 text-gray-400 hover:text-navy-900 disabled:opacity-20"
                                aria-label="Próximo estágio"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {stageLeads.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">Nenhum lead</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {detailId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6">
            {detailLoading || !detail ? (
              <p className="text-gray-600">Carregando...</p>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-navy-950">{detail.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {detail.phone}
                      </span>
                      {detail.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {detail.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Origem</p>
                    <p className="text-navy-950">{SOURCE_LABEL[detail.source] ?? detail.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Corretor</p>
                    <p className="text-navy-950">{detail.realtorName ?? '—'}</p>
                  </div>
                  {detail.properties && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Imóvel de interesse</p>
                      <p className="text-navy-950">
                        {detail.properties.title} · {detail.properties.code}
                      </p>
                    </div>
                  )}
                  {detail.internal_notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Observações</p>
                      <p className="text-navy-950 whitespace-pre-wrap">{detail.internal_notes}</p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Mover para</p>
                  <div className="flex flex-wrap gap-2">
                    {orderedStageValues.map((stage) => {
                      const label = [...FUNNEL_STAGES, LOST_STAGE].find((s) => s.value === stage)?.label ?? stage;
                      const active = detail.status === stage;
                      return (
                        <button
                          key={stage}
                          onClick={() => moveStage(detail.id, stage)}
                          disabled={moving || active}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            active
                              ? 'bg-navy-950 text-white'
                              : stage === 'lost'
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Histórico de movimentação
                  </p>
                  <ul className="space-y-2">
                    {detail.history.map((h) => (
                      <li key={h.id} className="text-xs border-l-2 border-gray-200 pl-3 py-0.5">
                        <span className="font-semibold text-navy-950">
                          {[...FUNNEL_STAGES, LOST_STAGE].find((s) => s.value === h.to_status)?.label ?? h.to_status}
                        </span>
                        <span className="text-gray-500">
                          {' '}
                          — {formatDateBR(h.created_at.slice(0, 10))} {h.changedByName ? `por ${h.changedByName}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
