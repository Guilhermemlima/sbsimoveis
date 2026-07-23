'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Lock, CheckCircle2 } from 'lucide-react';
import { formatDateBR } from '@/lib/format';

interface MaintenanceRequest {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  responsibility: string;
  responsibility_notes: string | null;
  owner_share_percentage: number;
  financial_action: string;
  financial_applied: boolean;
  estimated_cost: number | null;
  actual_cost: number | null;
  completed_by: string | null;
  completed_at: string | null;
  review_notes: string | null;
  ownerName: string | null;
  tenantName: string | null;
  created_at: string;
  properties?: { title: string; code: string; address: string; city: string; neighborhood: string };
}

interface Media {
  id: string;
  url: string | null;
  file_type: string;
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

const STATUS_LABEL: Record<string, string> = {
  requested: 'Solicitada',
  under_review: 'Em análise',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

const RESPONSIBILITY_LABEL: Record<string, string> = {
  pending_definition: 'A definir',
  owner: 'Proprietário',
  tenant: 'Inquilino',
  agency: 'Imobiliária',
  insurance: 'Seguro',
  shared: 'Compartilhada (proprietário/imobiliária)',
};

const FINANCIAL_ACTION_LABEL: Record<string, string> = {
  none: 'Nenhuma (apenas registro)',
  owner_deduction: 'Deduzir do próximo repasse ao proprietário',
  tenant_charge: 'Cobrar do inquilino',
  agency_expense: 'Despesa da imobiliária',
  insurance_claim: 'Acionar seguro (reconciliação manual)',
  shared: 'Compartilhada: parte do proprietário deduzida do repasse',
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  requested: ['under_review', 'cancelled'],
  under_review: ['approved', 'rejected', 'cancelled'],
  approved: ['in_progress', 'cancelled'],
  rejected: ['under_review', 'cancelled'],
  in_progress: ['cancelled'],
  completed: [],
  cancelled: [],
};

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm';
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

export default function MaintenanceDetailClient({ id }: { id: string }) {
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeForm, setCompleteForm] = useState({ actualCost: '', completedBy: '' });
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetch(`/api/admin/maintenance/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setRequest(data.request);
        setMedia(data.media);
        setReviewNotes(data.request.review_notes ?? '');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isLocked = request ? ['completed', 'cancelled'].includes(request.status) : false;

  const patchField = async (updates: Record<string, unknown>) => {
    setRequest((prev) => (prev ? { ...prev, ...updates } : prev));
    await fetch(`/api/admin/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  };

  const changeStatus = async (status: string) => {
    setError('');
    const body: Record<string, unknown> = { status };
    if (status === 'approved' || status === 'rejected') body.review_notes = reviewNotes;
    const res = await fetch(`/api/admin/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível alterar o status.');
      return;
    }
    load();
  };

  const uploadPhoto = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', 'photo');
    const res = await fetch(`/api/admin/maintenance/${id}/media`, { method: 'POST', body: formData });
    if (res.ok) load();
  };

  const complete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCompleting(true);
    const res = await fetch(`/api/admin/maintenance/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actualCost: Number(completeForm.actualCost),
        completedBy: completeForm.completedBy,
      }),
    });
    setCompleting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível concluir a manutenção.');
      return;
    }
    setShowComplete(false);
    load();
  };

  if (loading || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  const allowedTransitions = STATUS_TRANSITIONS[request.status] ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/maintenance"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à Manutenção
          </Link>
          <h1 className="text-3xl font-bold mb-2">{request.title}</h1>
          <p className="text-navy-100">
            {request.properties?.title} · {request.properties?.code}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap text-sm">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="font-semibold text-navy-950">
                {isLocked && <Lock className="w-3 h-3 inline mr-1" />}
                {STATUS_LABEL[request.status]}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Categoria</p>
              <p className="font-semibold text-navy-950">{CATEGORY_LABEL[request.category]}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Prioridade</p>
              <p className="font-semibold text-navy-950">{PRIORITY_LABEL[request.priority]}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Proprietário</p>
              <p className="font-semibold text-navy-950">{request.ownerName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Inquilino</p>
              <p className="font-semibold text-navy-950">{request.tenantName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Aberta em</p>
              <p className="font-semibold text-navy-950">{formatDateBR(request.created_at.slice(0, 10))}</p>
            </div>
          </div>
          {!isLocked && (request.status === 'approved' || request.status === 'in_progress') && (
            <button
              onClick={() => setShowComplete(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy-950 text-white rounded-lg text-sm font-semibold hover:bg-navy-900"
            >
              <CheckCircle2 className="w-4 h-4" />
              Concluir Manutenção
            </button>
          )}
        </div>

        {request.description && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-sm font-bold text-navy-950 mb-2">Descrição</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>
        )}

        {isLocked && (
          <div
            className={`rounded-lg p-4 text-sm ${request.status === 'completed' ? 'bg-green-50 border border-green-300 text-navy-950' : 'bg-red-50 border border-red-300 text-navy-950'}`}
          >
            {request.status === 'completed' ? (
              <>
                <p className="font-semibold mb-1">Manutenção concluída.</p>
                <p>Executado por: {request.completed_by}</p>
                <p>Custo real: R$ {Number(request.actual_cost).toFixed(2)}</p>
                <p>Responsabilidade: {RESPONSIBILITY_LABEL[request.responsibility]}</p>
                <p>Ação financeira: {FINANCIAL_ACTION_LABEL[request.financial_action]}</p>
              </>
            ) : (
              <p className="font-semibold">Solicitação cancelada.</p>
            )}
          </div>
        )}

        {!isLocked && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-sm font-bold text-navy-950 mb-4">Fluxo de aprovação</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {allowedTransitions.map((s) => (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-navy-100 text-navy-900 hover:bg-navy-200"
                >
                  {s === 'under_review' && 'Colocar em análise'}
                  {s === 'approved' && 'Aprovar'}
                  {s === 'rejected' && 'Rejeitar'}
                  {s === 'in_progress' && 'Iniciar execução'}
                  {s === 'cancelled' && 'Cancelar'}
                </button>
              ))}
            </div>
            {(request.status === 'under_review' || request.status === 'rejected') && (
              <div>
                <label className={labelClass}>Observações da análise (usadas ao aprovar/rejeitar)</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="text-sm font-bold text-navy-950 md:col-span-2">Responsabilidade e integração financeira</h2>

          <div>
            <label className={labelClass}>Responsável</label>
            <select
              disabled={isLocked}
              value={request.responsibility}
              onChange={(e) => patchField({ responsibility: e.target.value })}
              className={inputClass}
            >
              {Object.entries(RESPONSIBILITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Ação financeira ao concluir</label>
            <select
              disabled={isLocked}
              value={request.financial_action}
              onChange={(e) => patchField({ financial_action: e.target.value })}
              className={inputClass}
            >
              {Object.entries(FINANCIAL_ACTION_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {request.responsibility === 'shared' && (
            <div>
              <label className={labelClass}>% a cargo do proprietário</label>
              <input
                disabled={isLocked}
                type="number"
                min="0"
                max="100"
                step="1"
                value={request.owner_share_percentage}
                onChange={(e) => patchField({ owner_share_percentage: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Custo estimado</label>
            <input
              disabled={isLocked}
              type="number"
              min="0"
              step="0.01"
              value={request.estimated_cost ?? ''}
              onChange={(e) => patchField({ estimated_cost: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Observações sobre a responsabilidade</label>
            <textarea
              disabled={isLocked}
              value={request.responsibility_notes ?? ''}
              onChange={(e) => patchField({ responsibility_notes: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-navy-950">Fotos</h2>
            {!isLocked && (
              <label className="cursor-pointer inline-flex items-center gap-2 text-navy-600 hover:text-navy-800 text-sm font-semibold">
                <Camera className="w-4 h-4" />
                Adicionar foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file);
                  }}
                />
              </label>
            )}
          </div>
          {media.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma foto anexada.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {media.map((m) =>
                m.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={m.id} src={m.url} alt="Manutenção" className="w-24 h-24 object-cover rounded border border-gray-200" />
                ) : null
              )}
            </div>
          )}
        </div>

        {showComplete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <form onSubmit={complete} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-navy-950">Concluir Manutenção</h3>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className={labelClass}>Executado por (obrigatório)</label>
                <input
                  required
                  value={completeForm.completedBy}
                  onChange={(e) => setCompleteForm((f) => ({ ...f, completedBy: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Custo real (obrigatório)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={completeForm.actualCost}
                  onChange={(e) => setCompleteForm((f) => ({ ...f, actualCost: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-gray-500">
                Responsabilidade: {RESPONSIBILITY_LABEL[request.responsibility]} · Ação financeira:{' '}
                {FINANCIAL_ACTION_LABEL[request.financial_action]}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowComplete(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="px-4 py-2 bg-navy-950 text-white rounded-lg text-sm font-bold hover:bg-navy-900 disabled:opacity-50"
                >
                  {completing ? 'Concluindo...' : 'Concluir'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
