'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Download, Trash2, X, Loader2 } from 'lucide-react';
import type { Property } from '@/types';

interface Document {
  id: string;
  name: string;
  file_type: string | null;
  created_at: string;
  downloadUrl: string | null;
  propertyTitle: string;
  propertyCode: string;
}

export default function RealtorDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [propertyId, setPropertyId] = useState('');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const loadDocuments = () => {
    fetch('/api/realtor/documents')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDocuments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
    fetch('/api/realtor/properties')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!propertyId || !name || !file) {
      setError('Selecione o imóvel, dê um nome ao documento e escolha o arquivo.');
      return;
    }

    setSubmitting(true);
    const body = new FormData();
    body.append('property_id', propertyId);
    body.append('name', name);
    body.append('file', file);

    const res = await fetch('/api/realtor/documents', { method: 'POST', body });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível enviar o documento.');
      return;
    }

    setPropertyId('');
    setName('');
    setFile(null);
    setFormOpen(false);
    loadDocuments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este documento?')) return;
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    await fetch(`/api/realtor/documents/${id}`, { method: 'DELETE' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/realtor/dashboard"
              className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-2">Documentos</h1>
            <p className="text-navy-100">
              Contratos, matrícula, IPTU e outros arquivos dos seus imóveis
            </p>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Enviar Documento'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Imóvel</label>
              <select
                required
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              >
                <option value="">Selecione um imóvel</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome do documento
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Matrícula, Contrato, IPTU 2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
              />
            </div>

            <div className="md:col-span-2">
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
                {submitting ? 'Enviando...' : 'Enviar Documento'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-600">Carregando...</p>
          ) : documents.length === 0 ? (
            <p className="p-6 text-gray-600">Nenhum documento enviado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Documento</th>
                  <th className="px-6 py-3">Imóvel</th>
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
                    <td className="px-6 py-4 text-gray-600">
                      {doc.propertyTitle} · {doc.propertyCode}
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
