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
  Check,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { formatDateBR } from '@/lib/format';
import { CRM_STAGES, ALL_STAGES, DEAL_TYPE_LABEL, stageLabel, stageIndex } from '@/lib/crm-stages';
import type { CrmDealStage, CrmDealType, CrmDealFile, CrmDealStageHistory } from '@/types';

interface DealDetail {
  id: string;
  deal_type: CrmDealType;
  title: string;
  stage: CrmDealStage;
  property_address: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  deal_value: number | null;
  notes: string | null;
  realtorName: string | null;
  properties?: { title: string; code: string } | null;
  files: CrmDealFile[];
  history: CrmDealStageHistory[];
}

export default function CrmDealDetailClient({ id }: { id: string }) {
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);

  // Upload por etapa: guarda qual etapa está com o formulário aberto.
  const [uploadStage, setUploadStage] = useState<CrmDealStage | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Dados do comprador/locador, editáveis a partir da etapa correspondente.
  const [clientForm, setClientForm] = useState({ client_name: '', client_phone: '', client_email: '' });
  const [savingClient, setSavingClient] = useState(false);

  const load = () => {
    fetch(`/api/admin/crm-deals/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDeal(data);
          setClientForm({
            client_name: data.client_name ?? '',
            client_phone: data.client_phone ?? '',
            client_email: data.client_email ?? '',
          });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const moveStage = async (stage: CrmDealStage) => {
    setMoving(true);
    await fetch(`/api/admin/crm-deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    setMoving(false);
    load();
  };

  const saveClient = async () => {
    setSavingClient(true);
    await fetch(`/api/admin/crm-deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientForm),
    });
    setSavingClient(false);
    load();
  };

  const openUpload = (stage: CrmDealStage) => {
    setUploadStage(uploadStage === stage ? null : stage);
    setUploadName('');
    setUploadFiles([]);
    setError('');
  };

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadStage) return;
    setError('');
    if (!uploadName || uploadFiles.length === 0) {
      setError('Dê um nome ao anexo e escolha ao menos um arquivo.');
      return;
    }

    setUploading(true);
    const body = new FormData();
    body.append('stage', uploadStage);
    body.append('name', uploadName);
    uploadFiles.forEach((f) => body.append('file', f));

    const res = await fetch(`/api/admin/crm-deals/${id}/files`, { method: 'POST', body });
    setUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível enviar o anexo.');
      return;
    }

    setUploadStage(null);
    setUploadName('');
    setUploadFiles([]);
    load();
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Remover este anexo?')) return;
    setDeal((prev) => (prev ? { ...prev, files: prev.files.filter((f) => f.id !== fileId) } : prev));
    await fetch(`/api/admin/crm-deals/${id}/files/${fileId}`, { method: 'DELETE' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Captação não encontrada.</p>
      </div>
    );
  }

  const currentIndex = stageIndex(deal.stage);
  const isLost = deal.stage === 'perdido';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/crm"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o CRM
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                deal.deal_type === 'venda'
                  ? 'bg-purple-500/20 text-purple-100 border border-purple-400/40'
                  : 'bg-blue-500/20 text-blue-100 border border-blue-400/40'
              }`}
            >
              {DEAL_TYPE_LABEL[deal.deal_type]}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gold-500/20 text-gold-100 border border-gold-400/40">
              {stageLabel(deal.stage)}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{deal.title}</h1>
          <div className="flex flex-wrap gap-4 text-navy-100 text-sm">
            {(deal.properties || deal.property_address) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {deal.properties
                  ? `${deal.properties.title} (${deal.properties.code})`
                  : deal.property_address}
              </span>
            )}
            {deal.deal_value != null && (
              <span>R$ {Number(deal.deal_value).toLocaleString('pt-BR')}</span>
            )}
            {deal.realtorName && <span>Corretor: {deal.realtorName}</span>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Etapas com anexos */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-navy-950">Etapas da captação</h2>

          {CRM_STAGES.map((stage, index) => {
            const stageFiles = deal.files.filter((f) => f.stage === stage.value);
            const isDone = !isLost && index < currentIndex;
            const isCurrent = deal.stage === stage.value;

            return (
              <div
                key={stage.value}
                className={`bg-white rounded-xl shadow-sm border-2 transition-colors ${
                  isCurrent ? 'border-gold-400' : 'border-transparent'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                          isDone
                            ? 'bg-green-100 text-green-700'
                            : isCurrent
                              ? 'bg-gold-500 text-navy-950'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-navy-950">{stage.label}</h3>
                        <p className="text-xs text-gray-500">{stage.hint}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isCurrent && !isLost && (
                        <button
                          onClick={() => moveStage(stage.value)}
                          disabled={moving}
                          className="text-xs font-semibold text-navy-700 hover:text-navy-900 disabled:opacity-50"
                        >
                          Mover para cá
                        </button>
                      )}
                      <button
                        onClick={() => openUpload(stage.value)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gold-500 text-navy-950 rounded-lg font-bold text-xs hover:bg-gold-400 transition-colors"
                      >
                        {uploadStage === stage.value ? <X className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                        {uploadStage === stage.value ? 'Cancelar' : 'Anexar'}
                      </button>
                    </div>
                  </div>

                  {uploadStage === stage.value && (
                    <form onSubmit={submitUpload} className="bg-gray-50 rounded-lg p-4 mb-3 space-y-3">
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
                          {error}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Nome do anexo
                          </label>
                          <input
                            required
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                            placeholder={stage.hint}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Arquivo(s)
                          </label>
                          <input
                            required
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => setUploadFiles(Array.from(e.target.files ?? []))}
                            className="w-full text-xs text-gray-600"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={uploading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
                      >
                        {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {uploading
                          ? 'Enviando...'
                          : `Anexar ${uploadFiles.length > 1 ? `${uploadFiles.length} arquivos` : ''}`}
                      </button>
                    </form>
                  )}

                  {stageFiles.length === 0 ? (
                    <p className="text-xs text-gray-400 pl-10">Nenhum anexo nesta etapa.</p>
                  ) : (
                    <ul className="space-y-1.5 pl-10">
                      {stageFiles.map((f) => (
                        <li
                          key={f.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <span className="inline-flex items-center gap-2 text-sm text-navy-950">
                            <FileText className="w-4 h-4 text-gold-600" />
                            {f.name}
                            <span className="text-xs text-gray-400">
                              {formatDateBR(f.created_at.slice(0, 10))}
                            </span>
                          </span>
                          <div className="flex items-center gap-3">
                            {f.downloadUrl && (
                              <a
                                href={f.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-navy-900 hover:text-gold-600 font-semibold text-xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Baixar
                              </a>
                            )}
                            <button
                              onClick={() => deleteFile(f.id)}
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

                  {/* Dados do interessado, direto na etapa correspondente */}
                  {stage.value === 'comprador_locador' && (
                    <div className="pl-10 mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Dados do {deal.deal_type === 'venda' ? 'comprador' : 'locatário'}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                        <input
                          value={clientForm.client_name}
                          onChange={(e) => setClientForm((f) => ({ ...f, client_name: e.target.value }))}
                          placeholder="Nome"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          value={clientForm.client_phone}
                          onChange={(e) => setClientForm((f) => ({ ...f, client_phone: e.target.value }))}
                          placeholder="Telefone"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          value={clientForm.client_email}
                          onChange={(e) => setClientForm((f) => ({ ...f, client_email: e.target.value }))}
                          placeholder="E-mail"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <button
                        onClick={saveClient}
                        disabled={savingClient}
                        className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
                      >
                        {savingClient ? 'Salvando...' : 'Salvar dados'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {!isLost && (
            <button
              onClick={() => moveStage('perdido')}
              disabled={moving}
              className="text-sm text-red-600 hover:text-red-700 font-semibold"
            >
              Marcar captação como perdida
            </button>
          )}
          {isLost && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              Esta captação foi marcada como perdida.{' '}
              <button
                onClick={() => moveStage('assinatura_opcao')}
                className="font-semibold underline hover:text-red-900"
              >
                Reabrir
              </button>
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-sm font-bold text-navy-950 mb-3">Proprietário</h2>
            {deal.owner_name ? (
              <div className="space-y-1 text-sm">
                <p className="text-navy-950 font-medium">{deal.owner_name}</p>
                {deal.owner_phone && (
                  <p className="text-gray-600 inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {deal.owner_phone}
                  </p>
                )}
                {deal.owner_email && (
                  <p className="text-gray-600 inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {deal.owner_email}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Não informado.</p>
            )}
          </div>

          {deal.client_name && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-sm font-bold text-navy-950 mb-3">
                {deal.deal_type === 'venda' ? 'Comprador' : 'Locatário'}
              </h2>
              <div className="space-y-1 text-sm">
                <p className="text-navy-950 font-medium">{deal.client_name}</p>
                {deal.client_phone && (
                  <p className="text-gray-600 inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {deal.client_phone}
                  </p>
                )}
                {deal.client_email && (
                  <p className="text-gray-600 inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {deal.client_email}
                  </p>
                )}
              </div>
            </div>
          )}

          {deal.notes && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-sm font-bold text-navy-950 mb-2">Observações</h2>
              <p className="text-sm text-navy-950 whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-sm font-bold text-navy-950 mb-3 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Histórico
            </h2>
            <ul className="space-y-2">
              {deal.history.map((h) => (
                <li key={h.id} className="text-xs border-l-2 border-gray-200 pl-3 py-0.5">
                  <span className="font-semibold text-navy-950">
                    {ALL_STAGES.find((s) => s.value === h.to_stage)?.label ?? h.to_stage}
                  </span>
                  <span className="text-gray-500">
                    {' '}
                    — {formatDateBR(h.created_at.slice(0, 10))}
                    {h.changedByName ? ` por ${h.changedByName}` : ''}
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
