'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { formatDateBR } from '@/lib/format';
import PrintHeader from '@/components/common/PrintHeader';

interface Amendment {
  id: string;
  lease_contract_id: string;
  type: string;
  version: number;
  title: string;
  content: string;
  status: string;
  effective_date: string | null;
  agency_signature_name: string | null;
  agency_signed_at: string | null;
  owner_signature_name: string | null;
  tenant_signature_name: string | null;
  applied_at: string | null;
  created_at: string;
  lease_contracts?: {
    properties?: { title: string; code: string; address: string; city: string; neighborhood: string };
  };
}

interface HistoryEntry {
  id: string;
  version: number;
  type: string;
  title: string;
  status: string;
  created_at: string;
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

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm';
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

export default function AmendmentDetailClient({ id }: { id: string }) {
  const [amendment, setAmendment] = useState<Amendment | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSign, setShowSign] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signForm, setSignForm] = useState({
    agencySignatureName: '',
    ownerSignatureName: '',
    tenantSignatureName: '',
  });

  const load = useCallback(() => {
    fetch(`/api/admin/amendments/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setAmendment(data.amendment);
        setHistory(data.history);
        setContent(data.amendment.content);
        setTitle(data.amendment.title);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isDraft = amendment?.status === 'draft';
  const isLocked = amendment ? ['signed', 'cancelled'].includes(amendment.status) : false;

  const saveDraft = async () => {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/admin/amendments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível salvar.');
      return;
    }
    load();
  };

  const changeStatus = async (status: string) => {
    setError('');
    const res = await fetch(`/api/admin/amendments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível alterar o status.');
      return;
    }
    load();
  };

  const sign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSigning(true);
    const res = await fetch(`/api/admin/amendments/${id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signForm),
    });
    setSigning(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível assinar o aditivo.');
      return;
    }
    setShowSign(false);
    load();
  };

  if (loading || !amendment) {
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
            href="/admin/amendments"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Aditivos
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {amendment.title}
            <span className="ml-3 text-sm font-semibold px-2 py-1 rounded bg-white/10 align-middle">
              Versão {amendment.version}
            </span>
          </h1>
          <p className="text-navy-100">
            {amendment.lease_contracts?.properties?.title} · {amendment.lease_contracts?.properties?.code} ·{' '}
            {TYPE_LABEL[amendment.type]}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-8">
        <PrintHeader
          subtitle={`Aditivo contratual — ${amendment.lease_contracts?.properties?.title ?? ''} · ${amendment.lease_contracts?.properties?.code ?? ''}`}
        />
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm no-print">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-6 flex-wrap text-sm">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="font-semibold text-navy-950">
                {isLocked && <Lock className="w-3 h-3 inline mr-1" />}
                {STATUS_LABEL[amendment.status]}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Vigência</p>
              <p className="font-semibold text-navy-950">
                {amendment.effective_date ? formatDateBR(amendment.effective_date) : '—'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isDraft && (
              <button
                onClick={() => changeStatus('pending_signature')}
                className="px-4 py-2 bg-navy-950 text-white rounded-lg text-sm font-semibold hover:bg-navy-900"
              >
                Enviar para assinatura
              </button>
            )}
            {amendment.status === 'pending_signature' && (
              <>
                <button
                  onClick={() => changeStatus('draft')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Voltar para rascunho
                </button>
                <button
                  onClick={() => setShowSign(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-navy-950 text-white rounded-lg text-sm font-semibold hover:bg-navy-900"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Assinar Aditivo
                </button>
              </>
            )}
            {!isLocked && (
              <button
                onClick={() => changeStatus('cancelled')}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
            >
              Imprimir
            </button>
          </div>
        </div>

        {amendment.status === 'signed' && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-sm text-navy-950">
            <p className="font-semibold mb-1">
              Aditivo assinado e aplicado ao contrato — registro interno de assinatura.
            </p>
            <p>Imobiliária: {amendment.agency_signature_name}</p>
            {amendment.owner_signature_name && <p>Proprietário: {amendment.owner_signature_name}</p>}
            {amendment.tenant_signature_name && <p>Inquilino: {amendment.tenant_signature_name}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Não substitui assinatura eletrônica com validade jurídica.
            </p>
          </div>
        )}
        {amendment.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-sm text-navy-950 font-semibold">
            Aditivo cancelado.
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          {isDraft ? (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Título</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Conteúdo do aditivo</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={14}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <button
                onClick={saveDraft}
                disabled={saving}
                className="px-4 py-2 bg-navy-100 text-navy-900 rounded-lg text-sm font-semibold hover:bg-navy-200 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar rascunho'}
              </button>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">{amendment.content}</pre>
          )}
        </div>

        {history.length > 1 && (
          <div className="bg-white rounded-xl shadow-md p-6 no-print">
            <h2 className="text-sm font-bold text-navy-950 mb-3">Histórico de Aditivos deste Contrato</h2>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <Link
                  key={h.id}
                  href={`/admin/amendments/${h.id}`}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
                    h.id === amendment.id
                      ? 'bg-gold-500 border-gold-500 text-navy-950'
                      : 'bg-gray-50 border-gray-200 text-navy-800 hover:bg-gray-100'
                  }`}
                >
                  v{h.version} · {TYPE_LABEL[h.type] ?? h.type} ({STATUS_LABEL[h.status] ?? h.status})
                </Link>
              ))}
            </div>
          </div>
        )}

        {showSign && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 no-print">
            <form onSubmit={sign} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-navy-950">Assinar Aditivo</h3>
              <p className="text-xs text-gray-500">
                Registro interno de assinatura — não substitui assinatura eletrônica com validade
                jurídica. Ao assinar, as alterações são aplicadas ao contrato e o aditivo é bloqueado.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className={labelClass}>Nome de quem assina pela imobiliária (obrigatório)</label>
                <input
                  required
                  value={signForm.agencySignatureName}
                  onChange={(e) => setSignForm((f) => ({ ...f, agencySignatureName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nome do proprietário (se assinou)</label>
                <input
                  value={signForm.ownerSignatureName}
                  onChange={(e) => setSignForm((f) => ({ ...f, ownerSignatureName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nome do inquilino (se assinou)</label>
                <input
                  value={signForm.tenantSignatureName}
                  onChange={(e) => setSignForm((f) => ({ ...f, tenantSignatureName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSign(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={signing}
                  className="px-4 py-2 bg-navy-950 text-white rounded-lg text-sm font-bold hover:bg-navy-900 disabled:opacity-50"
                >
                  {signing ? 'Assinando...' : 'Assinar e Aplicar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
