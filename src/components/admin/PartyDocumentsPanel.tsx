'use client';

import { useEffect, useState } from 'react';
import { Upload, FileText, Download, Trash2, X, Loader2 } from 'lucide-react';

interface PartyDocument {
  id: string;
  name: string;
  file_type: string | null;
  created_at: string;
  downloadUrl: string | null;
}

interface PartyDocumentsPanelProps {
  /** Base da API de documentos, ex: /api/admin/tenants/{id}/documents */
  endpoint: string;
  title?: string;
  emptyLabel?: string;
  placeholder?: string;
}

export default function PartyDocumentsPanel({
  endpoint,
  title = 'Documentos',
  emptyLabel = 'Nenhum documento anexado ainda.',
  placeholder = 'Ex: RG, CPF, Comprovante de Renda, Contrato',
}: PartyDocumentsPanelProps) {
  const [documents, setDocuments] = useState<PartyDocument[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const load = () => {
    fetch(endpoint)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDocuments(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    load();
  }, [endpoint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || files.length === 0) {
      setError('Dê um nome ao documento e escolha ao menos um arquivo.');
      return;
    }

    setSubmitting(true);
    const body = new FormData();
    body.append('name', name);
    files.forEach((f) => body.append('file', f));

    const res = await fetch(endpoint, { method: 'POST', body });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível enviar o documento.');
      return;
    }

    setName('');
    setFiles([]);
    setFormOpen(false);
    load();
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Remover este documento?')) return;
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    await fetch(`${endpoint}/${docId}`, { method: 'DELETE' });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-navy-950">{title}</h2>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-navy-950 rounded-lg font-bold text-sm hover:bg-gold-400 transition-colors"
        >
          {formOpen ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          {formOpen ? 'Cancelar' : 'Anexar Documento'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {error && (
            <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do documento</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Arquivo(s)</label>
            <input
              required
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="w-full text-sm text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              PDF, Word ou imagem, até 15MB cada. Pode selecionar vários de uma vez.
            </p>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-navy-900 text-white rounded-lg font-bold text-sm hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Enviando...' : `Anexar ${files.length > 1 ? `${files.length} arquivos` : 'Documento'}`}
            </button>
          </div>
        </form>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="inline-flex items-center gap-2 text-sm text-navy-950">
                <FileText className="w-4 h-4 text-gold-600" />
                {doc.name}
                <span className="text-xs text-gray-400">
                  {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                </span>
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
                  onClick={() => handleDelete(doc.id)}
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
  );
}
