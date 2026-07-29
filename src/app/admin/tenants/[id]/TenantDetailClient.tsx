'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, User } from 'lucide-react';
import PartyDocumentsPanel from '@/components/admin/PartyDocumentsPanel';
import type { Tenant } from '@/types';

export default function TenantDetailClient({ id }: { id: string }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/tenants/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTenant(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Inquilino não encontrado.</p>
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-100 border border-blue-400/40">
              <User className="w-3 h-3" />
              Inquilino
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{tenant.name}</h1>
          <div className="flex flex-wrap gap-4 text-navy-100 text-sm">
            {tenant.document_number && <span>CPF: {tenant.document_number}</span>}
            {tenant.rg && <span>RG: {tenant.rg}</span>}
            {tenant.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {tenant.email}
              </span>
            )}
            {tenant.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {tenant.phone}
              </span>
            )}
            {tenant.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {tenant.address}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-8">
        {tenant.notes && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-navy-950 mb-2">Observações</h2>
            <p className="text-sm text-navy-950 whitespace-pre-wrap">{tenant.notes}</p>
          </div>
        )}

        <PartyDocumentsPanel
          endpoint={`/api/admin/tenants/${id}/documents`}
          title="Documentos do Inquilino"
          emptyLabel="Nenhum documento anexado a este inquilino ainda."
          placeholder="Ex: RG, CPF, Comprovante de Renda, Contrato"
        />
      </div>
    </div>
  );
}
