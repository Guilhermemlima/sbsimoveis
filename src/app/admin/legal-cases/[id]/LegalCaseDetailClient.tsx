'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  FileText,
  Download,
  Trash2,
  X,
  Loader2,
  Clock,
  Scale,
} from 'lucide-react';
import { formatDateBR } from '@/lib/format';
import type { LegalCaseType, LegalCaseStatus } from '@/types';

interface LegalCaseInfo {
  id: string;
  title: string;
  description: string | null;
  case_type: LegalCaseType;
  status: LegalCaseStatus;
  process_number: string | null;
  court: string | null;
  responsibleName: string | null;
  opened_date: string;
  deadline_date: string | null;
  closed_date: string | null;
  notes: string | null;
  properties?: { title: string; code: string } | null;
  tenants?: { name: string } | null;
  property_owners?: { name: string } | null;
  history: {
    id: string;
    from_status: LegalCaseStatus | null;
    to_status: LegalCaseStatus;
    changedByName: string | null;
    created_at: string;
  }[];
}

interface CaseDocument {
  id: string;
  name: string;
  file_type: string | null;
  created_at: string;
  downloadUrl: string | null;
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

const STATUS_FLOW: { value: LegalCaseStatus; label: string }[] = [
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'awaiting_response', label: 'Aguardando Resposta' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'archived', label: 'Arquivado' },
];

const STATUS_COLOR: Record<LegalCaseStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  awaiting_response: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-500',
};

export default function LegalCaseDetailClient({ id }: { id: string }) {
  const [legalCase, setLegalCase] = useState<LegalCaseInfo | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [moving, setMoving] = useState(false);

  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  const load = () => {
    fetch(`/api/admin/legal-cases/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setLegalCase(data);
          setDocuments(data.documents ?? []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const moveStatus = async (status: LegalCaseStatus) => {
    setMoving(true);
    await fetch(`/api/admin/legal-cases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setMoving(false);
    load();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!docName || !docFile) {
      setError('Dê um nome ao documento e escolha o arquivo.');
      return;
    }

    setSubmitting(true);
    const body = new FormData();
    body.append('name', docName);
    body.append('file', docFile);

    const res = await fetch(`/api/admin/legal-cases/${id}/documents`, { method: 'POST', body });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível enviar o documento.');
      return;
    }

    setDocName('');
    setDocFile(null);
    setFormOpen(false);
    load();
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Remover este documento?')) return;
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    await fetch(`/api/admin/legal-cases/${id}/documents/${docId}`, { method: 'DELETE' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!legalCase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Caso não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/legal-cases"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Jurídico
          </Link>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Scale className="w-7 h-7 text-gold-400" />
            {legalCase.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-navy-100 text-sm">
            <span>{CASE_TYPE_LABEL[legalCase.case_type]}</span>
            {legalCase.properties && (
              <span>
                · {legalCase.properties.title} ({legalCase.properties.code})
              </span>
            )}
            {legalCase.process_number && <span>· Processo nº {legalCase.process_number}</span>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-navy-950 mb-4">Detalhes</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[legalCase.status]}`}>
                  {STATUS_FLOW.find((s) => s.value === legalCase.status)?.label ?? legalCase.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Responsável</p>
                <p className="text-navy-950">{legalCase.responsibleName ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Aberto em</p>
                <p className="text-navy-950">{formatDateBR(legalCase.opened_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Prazo</p>
                <p className="text-navy-950">{legalCase.deadline_date ? formatDateBR(legalCase.deadline_date) : '—'}</p>
              </div>
              {legalCase.court && (
                <div>
                  <p className="text-xs text-gray-500">Vara / Tribunal</p>
                  <p className="text-navy-950">{legalCase.court}</p>
                </div>
              )}
              {legalCase.tenants && (
                <div>
                  <p className="text-xs text-gray-500">Inquilino</p>
                  <p className="text-navy-950">{legalCase.tenants.name}</p>
                </div>
              )}
              {legalCase.property_owners && (
                <div>
                  <p className="text-xs text-gray-500">Proprietário</p>
                  <p className="text-navy-950">{legalCase.property_owners.name}</p>
                </div>
              )}
            </div>
            {legalCase.description && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Descrição</p>
                <p className="text-navy-950 whitespace-pre-wrap text-sm">{legalCase.description}</p>
              </div>
            )}
            {legalCase.notes && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Observações</p>
                <p className="text-navy-950 whitespace-pre-wrap text-sm">{legalCase.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-navy-950">Documentos</h2>
              <button
                onClick={() => setFormOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-navy-950 rounded-lg font-bold text-sm hover:bg-gold-400 transition-colors"
              >
                {formOpen ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {formOpen ? 'Cancelar' : 'Anexar Documento'}
              </button>
            </div>

            {formOpen && (
              <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {error && (
                  <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do documento</label>
                  <input
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="Ex: Notificação extrajudicial, petição inicial"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Arquivo</label>
                  <input
                    required
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-600"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-navy-900 text-white rounded-lg font-bold text-sm hover:bg-navy-800 transition-colors disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}

            {documents.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum documento anexado ainda.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-sm text-navy-950">
                      <FileText className="w-4 h-4 text-gold-600" />
                      {doc.name}
                    </span>
                    <div className="flex items-center gap-3">
                      {doc.downloadUrl && (
                        <a
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-navy-900 hover:text-gold-600 font-semibold text-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-sm font-bold text-navy-950 mb-3">Mover status</h2>
            <div className="flex flex-wrap gap-2">
              {STATUS_FLOW.map((s) => (
                <button
                  key={s.value}
                  onClick={() => moveStatus(s.value)}
                  disabled={moving || legalCase.status === s.value}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    legalCase.status === s.value
                      ? 'bg-navy-950 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-sm font-bold text-navy-950 mb-3 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Histórico de movimentação
            </h2>
            <ul className="space-y-2">
              {legalCase.history.map((h) => (
                <li key={h.id} className="text-xs border-l-2 border-gray-200 pl-3 py-0.5">
                  <span className="font-semibold text-navy-950">
                    {STATUS_FLOW.find((s) => s.value === h.to_status)?.label ?? h.to_status}
                  </span>
                  <span className="text-gray-500">
                    {' '}
                    — {formatDateBR(h.created_at.slice(0, 10))} {h.changedByName ? `por ${h.changedByName}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
