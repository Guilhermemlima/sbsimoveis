'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, ShoppingBag } from 'lucide-react';
import PartyDocumentsPanel from '@/components/admin/PartyDocumentsPanel';

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
}

export default function ClientDetailClient({ id }: { id: string }) {
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/clients/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setClient(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cliente não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Clientes
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-100 border border-purple-400/40">
              <ShoppingBag className="w-3 h-3" />
              Comprador
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{client.name}</h1>
          <div className="flex flex-wrap gap-4 text-navy-100 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              {client.email}
            </span>
            {client.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {client.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <PartyDocumentsPanel
          endpoint={`/api/admin/clients/${id}/documents`}
          title="Documentos do Cliente"
          emptyLabel="Nenhum documento anexado a este cliente ainda."
          placeholder="Ex: RG, CPF, Comprovante de Renda, Contrato"
        />
      </div>
    </div>
  );
}
