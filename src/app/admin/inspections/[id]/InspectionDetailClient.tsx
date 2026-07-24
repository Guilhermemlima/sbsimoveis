'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Camera, Lock, CheckCircle2, GitCompare } from 'lucide-react';
import { formatDateBR } from '@/lib/format';
import PrintHeader from '@/components/common/PrintHeader';

interface Inspection {
  id: string;
  property_id: string;
  type: string;
  custom_type_label: string | null;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  performed_date: string | null;
  notes: string | null;
  final_report: string | null;
  inspector_signature_name: string | null;
  inspector_signed_at: string | null;
  tenant_signature_name: string | null;
  owner_signature_name: string | null;
  is_locked: boolean;
  version: number;
  superseded_by: string | null;
  ownerName: string | null;
  tenantName: string | null;
  properties?: { title: string; code: string; address: string; city: string; neighborhood: string };
}

interface VersionHistoryEntry {
  id: string;
  version: number;
  status: string;
  created_at: string;
  is_locked: boolean;
}

interface Environment {
  id: string;
  name: string;
  order_index: number;
}

interface Item {
  id: string;
  environment_id: string;
  item_type: string;
  rating: string;
  comments: string | null;
  pre_existing_damage: boolean;
  damage_during_lease: boolean;
}

interface Media {
  id: string;
  environment_id: string | null;
  item_id: string | null;
  url: string | null;
  file_type: string;
}

const TYPE_LABEL: Record<string, string> = {
  entry: 'Vistoria de Entrada',
  exit: 'Vistoria de Saída',
  periodic: 'Vistoria Periódica',
  emergency: 'Vistoria Emergencial',
  maintenance: 'Vistoria de Manutenção',
  custom: 'Vistoria Personalizada',
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

const RATING_LABEL: Record<string, string> = {
  new: 'Novo',
  excellent: 'Ótimo',
  good: 'Bom',
  regular: 'Regular',
  bad: 'Ruim',
  damaged: 'Danificado',
  not_applicable: 'N/A',
};

const RATING_COLOR: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-800',
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  regular: 'bg-yellow-100 text-yellow-800',
  bad: 'bg-orange-100 text-orange-800',
  damaged: 'bg-red-100 text-red-800',
  not_applicable: 'bg-gray-100 text-gray-500',
};

export default function InspectionDetailClient({ id }: { id: string }) {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [versionHistory, setVersionHistory] = useState<VersionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEnvName, setNewEnvName] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [finalizeForm, setFinalizeForm] = useState({
    inspectorSignatureName: '',
    tenantSignatureName: '',
    ownerSignatureName: '',
    finalReport: '',
  });
  const [showFinalize, setShowFinalize] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetch(`/api/admin/inspections/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setInspection(data.inspection);
        setEnvironments(data.environments);
        setItems(data.items);
        setMedia(data.media);
        setVersionHistory(data.versionHistory ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const addEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;
    const res = await fetch(`/api/admin/inspections/${id}/environments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newEnvName }),
    });
    if (res.ok) {
      setNewEnvName('');
      load();
    }
  };

  const updateItem = async (itemId: string, updates: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...updates } : it)));
    await fetch(`/api/admin/inspections/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  };

  const uploadPhoto = async (environmentId: string, itemId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('environment_id', environmentId);
    formData.append('item_id', itemId);
    formData.append('file_type', 'photo');
    const res = await fetch(`/api/admin/inspections/${id}/media`, { method: 'POST', body: formData });
    if (res.ok) load();
  };

  const updateStatus = async (status: string) => {
    await fetch(`/api/admin/inspections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const finalize = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFinalizing(true);
    const res = await fetch(`/api/admin/inspections/${id}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalizeForm),
    });
    setFinalizing(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível concluir a vistoria.');
      return;
    }
    setShowFinalize(false);
    load();
  };

  const createNewVersion = async () => {
    setCreatingVersion(true);
    const res = await fetch(`/api/admin/inspections/${id}/new-version`, { method: 'POST' });
    setCreatingVersion(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível criar uma nova versão.');
      return;
    }
    const data = await res.json();
    window.location.href = `/admin/inspections/${data.id}`;
  };

  if (loading || !inspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8 no-print">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/inspections"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar às Vistorias
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {inspection.type === 'custom'
                  ? inspection.custom_type_label || 'Vistoria Personalizada'
                  : TYPE_LABEL[inspection.type]}
                <span className="ml-3 text-sm font-semibold px-2 py-1 rounded bg-white/10 align-middle">
                  Versão {inspection.version}
                </span>
              </h1>
              <p className="text-navy-100">
                {inspection.properties?.title} · {inspection.properties?.code}
              </p>
            </div>
            {!inspection.is_locked && (
              <div className="flex gap-2 flex-wrap">
                {['scheduled', 'confirmed', 'in_progress', 'with_pending_issues'].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                      inspection.status === s ? 'bg-gold-500 text-navy-950' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-8">
        <PrintHeader
          subtitle={`Laudo de vistoria — ${inspection.properties?.title ?? ''} · ${inspection.properties?.code ?? ''}`}
        />
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap text-sm">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="font-semibold text-navy-950">
                {inspection.is_locked && <Lock className="w-3 h-3 inline mr-1" />}
                {STATUS_LABEL[inspection.status]}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Proprietário</p>
              <p className="font-semibold text-navy-950">{inspection.ownerName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Inquilino</p>
              <p className="font-semibold text-navy-950">{inspection.tenantName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Data</p>
              <p className="font-semibold text-navy-950">
                {inspection.performed_date
                  ? formatDateBR(inspection.performed_date)
                  : inspection.scheduled_date
                    ? formatDateBR(inspection.scheduled_date)
                    : '—'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <Link
              href={`/admin/inspections/compare?property=${inspection.property_id}&b=${inspection.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-navy-300 text-navy-900 rounded-lg text-sm font-semibold hover:bg-navy-50"
            >
              <GitCompare className="w-4 h-4" />
              Comparar
            </Link>
            {!inspection.is_locked && (
              <button
                onClick={() => setShowFinalize(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-navy-950 text-white rounded-lg text-sm font-semibold hover:bg-navy-900"
              >
                <CheckCircle2 className="w-4 h-4" />
                Concluir e Assinar
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
            >
              Imprimir Laudo
            </button>
          </div>
        </div>

        {inspection.is_locked && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-sm text-navy-950">
            <p className="font-semibold mb-1">Vistoria concluída e assinada — laudo bloqueado para edição.</p>
            <p>Vistoriador: {inspection.inspector_signature_name}</p>
            {inspection.tenant_signature_name && <p>Inquilino: {inspection.tenant_signature_name}</p>}
            {inspection.owner_signature_name && <p>Proprietário: {inspection.owner_signature_name}</p>}
            {inspection.final_report && (
              <p className="mt-2 whitespace-pre-wrap">{inspection.final_report}</p>
            )}
            {!inspection.superseded_by && (
              <div className="mt-3 no-print">
                <button
                  onClick={createNewVersion}
                  disabled={creatingVersion}
                  className="px-4 py-2 bg-white border border-navy-300 text-navy-900 rounded-lg text-sm font-semibold hover:bg-navy-50 disabled:opacity-50"
                >
                  {creatingVersion ? 'Criando nova versão...' : 'Criar Nova Versão (corrigir laudo)'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  O laudo original nunca é alterado ou apagado — uma nova versão é criada a partir dele.
                </p>
              </div>
            )}
          </div>
        )}

        {versionHistory.length > 1 && (
          <div className="bg-white rounded-xl shadow-md p-6 no-print">
            <h2 className="text-sm font-bold text-navy-950 mb-3">Histórico de Versões</h2>
            <div className="flex flex-wrap gap-2">
              {versionHistory.map((v) => (
                <Link
                  key={v.id}
                  href={`/admin/inspections/${v.id}`}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
                    v.id === inspection.id
                      ? 'bg-gold-500 border-gold-500 text-navy-950'
                      : 'bg-gray-50 border-gray-200 text-navy-800 hover:bg-gray-100'
                  }`}
                >
                  Versão {v.version} {v.is_locked ? '(concluída)' : `(${STATUS_LABEL[v.status] ?? v.status})`}
                </Link>
              ))}
            </div>
          </div>
        )}

        {!inspection.is_locked && (
          <form onSubmit={addEnvironment} className="flex gap-2 no-print">
            <input
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              placeholder="Novo ambiente (ex: Varanda, Lavanderia...)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy-100 text-navy-900 rounded-lg font-semibold text-sm hover:bg-navy-200"
            >
              <Plus className="w-4 h-4" />
              Adicionar Ambiente
            </button>
          </form>
        )}

        {environments.map((env) => (
          <div key={env.id} className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-navy-950 mb-4">{env.name}</h2>
            <div className="space-y-3">
              {items
                .filter((it) => it.environment_id === env.id)
                .map((item) => {
                  const itemMedia = media.filter((m) => m.item_id === item.id);
                  return (
                    <div key={item.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-navy-950 text-sm w-32 shrink-0">{item.item_type}</p>
                        <select
                          disabled={inspection.is_locked}
                          value={item.rating}
                          onChange={(e) => updateItem(item.id, { rating: e.target.value })}
                          className={`px-2 py-1 rounded text-xs font-semibold border-0 ${RATING_COLOR[item.rating]}`}
                        >
                          {Object.entries(RATING_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <input
                          disabled={inspection.is_locked}
                          value={item.comments ?? ''}
                          onChange={(e) => updateItem(item.id, { comments: e.target.value })}
                          placeholder="Comentário"
                          className="flex-1 min-w-[160px] px-2 py-1 border border-gray-200 rounded text-sm"
                        />
                        <label className="flex items-center gap-1 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            disabled={inspection.is_locked}
                            checked={item.pre_existing_damage}
                            onChange={(e) => updateItem(item.id, { pre_existing_damage: e.target.checked })}
                          />
                          Preexistente
                        </label>
                        <label className="flex items-center gap-1 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            disabled={inspection.is_locked}
                            checked={item.damage_during_lease}
                            onChange={(e) => updateItem(item.id, { damage_during_lease: e.target.checked })}
                          />
                          Dano na locação
                        </label>
                        {!inspection.is_locked && (
                          <label className="cursor-pointer text-navy-600 hover:text-navy-800 no-print">
                            <Camera className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadPhoto(env.id, item.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                      {itemMedia.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {itemMedia.map((m) =>
                            m.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={m.id}
                                src={m.url}
                                alt={item.item_type}
                                className="w-16 h-16 object-cover rounded border border-gray-200"
                              />
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {showFinalize && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 no-print">
            <form
              onSubmit={finalize}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
            >
              <h3 className="text-lg font-bold text-navy-950">Concluir e Assinar Vistoria</h3>
              <p className="text-xs text-gray-500">
                Registro interno de assinatura — não substitui assinatura eletrônica com validade
                jurídica. Após concluir, o laudo é bloqueado para edição.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nome do vistoriador (obrigatório)
                </label>
                <input
                  required
                  value={finalizeForm.inspectorSignatureName}
                  onChange={(e) =>
                    setFinalizeForm((f) => ({ ...f, inspectorSignatureName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nome do inquilino (se assinou)
                </label>
                <input
                  value={finalizeForm.tenantSignatureName}
                  onChange={(e) => setFinalizeForm((f) => ({ ...f, tenantSignatureName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nome do proprietário (se assinou)
                </label>
                <input
                  value={finalizeForm.ownerSignatureName}
                  onChange={(e) => setFinalizeForm((f) => ({ ...f, ownerSignatureName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Observações do laudo final
                </label>
                <textarea
                  value={finalizeForm.finalReport}
                  onChange={(e) => setFinalizeForm((f) => ({ ...f, finalReport: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowFinalize(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={finalizing}
                  className="px-4 py-2 bg-navy-950 text-white rounded-lg text-sm font-bold hover:bg-navy-900 disabled:opacity-50"
                >
                  {finalizing ? 'Concluindo...' : 'Concluir Vistoria'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
