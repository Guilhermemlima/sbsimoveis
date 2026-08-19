'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BackToDashboardLink from '@/components/common/BackToDashboardLink';
import CurrencyInput from '@/components/common/CurrencyInput';
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Paperclip,
  Home,
  KeyRound,
  User,
} from 'lucide-react';
import { CRM_STAGES, LOST_STAGE, DEAL_TYPE_LABEL, adjacentStage } from '@/lib/crm-stages';
import type { CrmDealStage, CrmDealType } from '@/types';

interface Deal {
  id: string;
  deal_type: CrmDealType;
  title: string;
  stage: CrmDealStage;
  property_address: string | null;
  owner_name: string | null;
  client_name: string | null;
  deal_value: number | null;
  realtorName: string | null;
  fileCount: number;
  properties?: { title: string; code: string } | null;
}

interface PropertyOption {
  id: string;
  title: string;
  code: string;
}

const emptyForm = {
  title: '',
  deal_type: 'venda' as CrmDealType,
  property_id: '',
  property_address: '',
  owner_id: '',
  owner_name: '',
  owner_phone: '',
  owner_email: '',
  deal_value: '',
  notes: '',
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold-500';
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

export default function CrmPipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [owners, setOwners] = useState<{ id: string; name: string; email: string | null; phone: string | null }[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | CrmDealType>('all');
  const [moving, setMoving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetch('/api/admin/crm-deals')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDeals(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch('/api/realtor/properties')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []));
    fetch('/api/admin/owners')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOwners(Array.isArray(data) ? data : []));
  }, []);

  /** Ao escolher um proprietário cadastrado, preenche nome/telefone/e-mail. */
  const pickOwner = (ownerId: string) => {
    const o = owners.find((x) => x.id === ownerId);
    setForm((f) => ({
      ...f,
      owner_id: ownerId,
      owner_name: o?.name ?? f.owner_name,
      owner_phone: o?.phone ?? f.owner_phone,
      owner_email: o?.email ?? f.owner_email,
    }));
  };

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const visible = useMemo(
    () => (typeFilter === 'all' ? deals : deals.filter((d) => d.deal_type === typeFilter)),
    [deals, typeFilter]
  );

  const columns = useMemo(() => {
    const map = new Map<CrmDealStage, Deal[]>();
    [...CRM_STAGES, LOST_STAGE].forEach((s) => map.set(s.value, []));
    visible.forEach((d) => map.get(d.stage)?.push(d));
    return map;
  }, [visible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/admin/crm-deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível abrir a captação.');
      return;
    }

    setForm(emptyForm);
    setFormOpen(false);
    load();
  };

  const moveStage = async (id: string, stage: CrmDealStage) => {
    setMoving(true);
    const res = await fetch(`/api/admin/crm-deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    setMoving(false);
    if (res.ok) load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <BackToDashboardLink />
            <h1 className="text-3xl font-bold mb-2">CRM — Captação</h1>
            <p className="text-navy-100">
              Da assinatura da opção até o contrato assinado, com os documentos de cada etapa
            </p>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Nova Captação'}
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

            <div className="md:col-span-3">
              <label className={labelClass}>Esta captação é de</label>
              <div className="flex gap-3">
                {(['venda', 'locacao'] as CrmDealType[]).map((t) => (
                  <label
                    key={t}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50"
                  >
                    <input
                      type="radio"
                      name="deal_type"
                      checked={form.deal_type === t}
                      onChange={() => set('deal_type', t)}
                    />
                    {t === 'venda' ? <Home className="w-4 h-4 text-gray-500" /> : <KeyRound className="w-4 h-4 text-gray-500" />}
                    <span className="text-sm">{DEAL_TYPE_LABEL[t]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Título da captação</label>
              <input
                required
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ex: Casa Bairro Trianon — Sr. João"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Valor pretendido</label>
              <CurrencyInput value={form.deal_value} onChange={(v) => set('deal_value', v)} />
            </div>

            <div>
              <label className={labelClass}>Imóvel já cadastrado (opcional)</label>
              <select
                value={form.property_id}
                onChange={(e) => set('property_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Ainda não cadastrado</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Endereço do imóvel</label>
              <input
                value={form.property_address}
                onChange={(e) => set('property_address', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-3 bg-gold-50/60 border border-gold-200 rounded-lg p-3">
              <label className={labelClass}>Proprietário já cadastrado</label>
              <select value={form.owner_id} onChange={(e) => pickOwner(e.target.value)} className={inputClass}>
                <option value="">Não cadastrado — preencher abaixo</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                    {o.email ? ` · ${o.email}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Vinculando o cadastro, os documentos anexados no CRM são copiados automaticamente para a
                ficha dele.
              </p>
            </div>

            <div>
              <label className={labelClass}>Proprietário</label>
              <input
                value={form.owner_name}
                onChange={(e) => set('owner_name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input
                value={form.owner_phone}
                onChange={(e) => set('owner_phone', e.target.value)}
                placeholder="(42) 99999-9999"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>E-mail</label>
              <input
                type="email"
                value={form.owner_email}
                onChange={(e) => set('owner_email', e.target.value)}
                className={inputClass}
              />
            </div>

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
                {submitting ? 'Salvando...' : 'Abrir Captação'}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {([
            ['all', 'Todas'],
            ['venda', 'Venda'],
            ['locacao', 'Locação'],
          ] as ['all' | CrmDealType, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                typeFilter === value
                  ? 'bg-navy-950 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">
                ({value === 'all' ? deals.length : deals.filter((d) => d.deal_type === value).length})
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-600">Carregando...</p>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {[...CRM_STAGES, LOST_STAGE].map((stage) => {
                const stageDeals = columns.get(stage.value) ?? [];
                const isLost = stage.value === 'perdido';
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
                        {stageDeals.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow"
                        >
                          <Link
                            href={`/admin/crm/${deal.id}`}
                            className="block font-semibold text-navy-950 text-sm hover:text-gold-600"
                          >
                            {deal.title}
                          </Link>

                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                deal.deal_type === 'venda'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {DEAL_TYPE_LABEL[deal.deal_type]}
                            </span>
                            {deal.fileCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500">
                                <Paperclip className="w-3 h-3" />
                                {deal.fileCount}
                              </span>
                            )}
                          </div>

                          {(deal.properties || deal.property_address) && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {deal.properties
                                ? `${deal.properties.title} · ${deal.properties.code}`
                                : deal.property_address}
                            </p>
                          )}
                          {deal.owner_name && (
                            <p className="text-xs text-gray-500 truncate inline-flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3" />
                              {deal.owner_name}
                            </p>
                          )}
                          {deal.deal_value != null && (
                            <p className="text-xs font-semibold text-navy-950 mt-1">
                              R$ {Number(deal.deal_value).toLocaleString('pt-BR')}
                            </p>
                          )}

                          {!isLost && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                              <button
                                onClick={() => {
                                  const prev = adjacentStage(deal.stage, -1);
                                  if (prev) moveStage(deal.id, prev);
                                }}
                                disabled={!adjacentStage(deal.stage, -1) || moving}
                                className="p-1 text-gray-400 hover:text-navy-900 disabled:opacity-20"
                                aria-label="Etapa anterior"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveStage(deal.id, 'perdido')}
                                disabled={moving}
                                className="p-1 text-gray-400 hover:text-red-600"
                                aria-label="Marcar como perdida"
                                title="Marcar como perdida"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const next = adjacentStage(deal.stage, 1);
                                  if (next) moveStage(deal.id, next);
                                }}
                                disabled={!adjacentStage(deal.stage, 1) || moving}
                                className="p-1 text-gray-400 hover:text-navy-900 disabled:opacity-20"
                                aria-label="Próxima etapa"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {stageDeals.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">Nenhuma captação</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
