'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Download, Trash2, X, Loader2, Mail, Phone, MapPin } from 'lucide-react';

interface GuarantorInfo {
  id: string;
  name: string;
  document_number: string | null;
  rg: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

interface GuarantorDocument {
  id: string;
  name: string;
  file_type: string | null;
  created_at: string;
  downloadUrl: string | null;
}

export default function GuarantorDetailClient({ id }: { id: string }) {
  const [guarantor, setGuarantor] = useState<GuarantorInfo | null>(null);
  const [documents, setDocuments] = useState<GuarantorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const loadDocuments = () => {
    fetch(`/api/admin/guarantors/${id}/documents`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDocuments(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetch(`/api/admin/guarantors/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setGuarantor(data))
      .finally(() => setLoading(false));
    loadDocuments();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !file) {
      setError('Dê um nome ao documento e escolha o arquivo.');
      return;
    }

    setSubmitting(true);
    const body = new FormData();
    body.append('name', name);
    body.append('file', file);

    const res = await fetch(`/api/admin/guarantors/${id}/documents`, { method: 'POST', body });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível enviar o documento.');
      return;
    }

    setName('');
    setFile(null);
    loadDocuments();
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Remover este documento?')) return;
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    await fetch(`/api/admin/guarantors/${id}/documents/${docId}`, { method: 'DELETE' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!guarantor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Fiador não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/guarantors"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Fiadores
          </Link>
          <h1 className="text-3xl font-bold mb-2">{guarantor.name}</h1>
          <div className="flex flex-wrap gap-4 text-navy-100 text-sm">
            {guarantor.document_number && <span>CPF: {guarantor.document_number}</span>}
            {guarantor.rg && <span>RG: {guarantor.rg}</span>}
            {guarantor.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {guarantor.email}
              </span>
            )}
            {guarantor.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {guarantor.phone}
              </span>
            )}
            {guarantor.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {guarantor.address}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Documentos do Fiador</h2>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Anexar Documento'}
          </button>
        </div>

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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome do documento
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Comprovante de Renda, RG, Contrato"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Arquivo</label>
              <input
                required
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">PDF, Word ou imagem, até 15MB.</p>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Enviando...' : 'Anexar Documento'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {documents.length === 0 ? (
            <p className="p-6 text-gray-600">Nenhum documento anexado a este fiador ainda.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Documento</th>
                  <th className="px-6 py-3">Enviado em</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t border-gray-100">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-navy-950">
                        <FileText className="w-4 h-4 text-gold-600" />
                        {doc.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {doc.downloadUrl && (
                          <a
                            href={doc.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-navy-900 hover:text-gold-600 font-semibold"
                          >
                            <Download className="w-4 h-4" />
                            Baixar
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
