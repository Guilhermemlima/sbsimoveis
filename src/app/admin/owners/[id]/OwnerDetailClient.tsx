'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Home } from 'lucide-react';
import PartyDocumentsPanel from '@/components/admin/PartyDocumentsPanel';
import type { PropertyOwner, OwnerPaymentMethod } from '@/types';

const PAYMENT_METHOD_LABEL: Record<OwnerPaymentMethod, string> = {
  pix: 'PIX',
  ted: 'TED',
  doc: 'DOC',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
};

export default function OwnerDetailClient({ id }: { id: string }) {
  const [owner, setOwner] = useState<PropertyOwner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/owners/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOwner(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Proprietário não encontrado.</p>
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-400/40">
              <Home className="w-3 h-3" />
              Proprietário
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{owner.name}</h1>
          <div className="flex flex-wrap gap-4 text-navy-100 text-sm">
            {owner.document_number && <span>CPF/CNPJ: {owner.document_number}</span>}
            {owner.rg && <span>RG: {owner.rg}</span>}
            {owner.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {owner.email}
              </span>
            )}
            {owner.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {owner.phone}
              </span>
            )}
            {owner.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {owner.address}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-navy-950 mb-4">Dados de Repasse</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Forma de pagamento</p>
              <p className="text-navy-950">{PAYMENT_METHOD_LABEL[owner.payment_method ?? 'pix']}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Melhor dia</p>
              <p className="text-navy-950">
                {owner.preferred_payment_day ? `Dia ${owner.preferred_payment_day}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Favorecido</p>
              <p className="text-navy-950">{owner.payment_beneficiary_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Chave PIX</p>
              <p className="text-navy-950 break-all">{owner.pix_key || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Banco</p>
              <p className="text-navy-950">{owner.bank_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Agência / Conta</p>
              <p className="text-navy-950">
                {owner.bank_agency || '—'} / {owner.bank_account || '—'}
              </p>
            </div>
          </div>
        </div>

        {owner.notes && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-navy-950 mb-2">Observações</h2>
            <p className="text-sm text-navy-950 whitespace-pre-wrap">{owner.notes}</p>
          </div>
        )}

        <PartyDocumentsPanel
          endpoint={`/api/admin/owners/${id}/documents`}
          title="Documentos do Proprietário"
          emptyLabel="Nenhum documento anexado a este proprietário ainda."
          placeholder="Ex: RG, CPF, Matrícula do Imóvel, Procuração"
        />
      </div>
    </div>
  );
}
