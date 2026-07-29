'use client';

import { useEffect, useState } from 'react';
import BackToDashboardLink from '@/components/common/BackToDashboardLink';
import { AlertTriangle, MessageCircle, Mail, Loader2 } from 'lucide-react';
import { formatDateBR } from '@/lib/format';

interface OverdueCharge {
  id: string;
  tenantName: string;
  tenantPhone: string | null;
  tenantEmail: string | null;
  propertyTitle: string;
  propertyCode: string;
  description: string;
  amount: number;
  dueDate: string;
  daysLate: number;
  lateFee: number;
  interest: number;
  total: number;
}

function formatMoney(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function whatsappUrl(charge: OverdueCharge): string | null {
  if (!charge.tenantPhone) return null;
  const digits = charge.tenantPhone.replace(/\D/g, '');
  const phone = digits.startsWith('55') ? digits : `55${digits}`;
  const message =
    `Olá, ${charge.tenantName}! Identificamos que a parcela "${charge.description}" ` +
    `do imóvel ${charge.propertyTitle} (${charge.propertyCode}), no valor de ${formatMoney(charge.amount)}, ` +
    `venceu em ${formatDateBR(charge.dueDate)} e está ${charge.daysLate} dia(s) em atraso.\n\n` +
    `Com multa (${formatMoney(charge.lateFee)}) e juros (${formatMoney(charge.interest)}), ` +
    `o valor atualizado é ${formatMoney(charge.total)}.\n\n` +
    `Poderia regularizar o pagamento? Qualquer dúvida estamos à disposição.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function mailtoUrl(charge: OverdueCharge): string | null {
  if (!charge.tenantEmail) return null;
  const subject = `Cobrança em atraso - ${charge.propertyTitle} (${charge.propertyCode})`;
  const body =
    `Olá, ${charge.tenantName},\n\n` +
    `Identificamos que a parcela "${charge.description}" do imóvel ${charge.propertyTitle} (${charge.propertyCode}), ` +
    `no valor de ${formatMoney(charge.amount)}, venceu em ${formatDateBR(charge.dueDate)} e está ${charge.daysLate} dia(s) em atraso.\n\n` +
    `Valor original: ${formatMoney(charge.amount)}\n` +
    `Multa: ${formatMoney(charge.lateFee)}\n` +
    `Juros: ${formatMoney(charge.interest)}\n` +
    `Total atualizado: ${formatMoney(charge.total)}\n\n` +
    `Poderia regularizar o pagamento? Qualquer dúvida estamos à disposição.\n\nAtenciosamente,\nSBS Imóveis`;
  return `mailto:${charge.tenantEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function OverdueRentChargesPage() {
  const [charges, setCharges] = useState<OverdueCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendStatus, setSendStatus] = useState<Record<string, 'sending' | 'sent' | string>>({});

  useEffect(() => {
    fetch('/api/admin/rent-charges/overdue')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCharges(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const totalOverdue = charges.reduce((sum, c) => sum + c.total, 0);

  const sendCollectionEmail = async (id: string) => {
    setSendStatus((prev) => ({ ...prev, [id]: 'sending' }));
    const res = await fetch(`/api/admin/rent-charges/${id}/send-collection`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setSendStatus((prev) => ({ ...prev, [id]: res.ok ? 'sent' : data.error || 'Erro ao enviar.' }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <BackToDashboardLink />
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-red-400" />
            Parcelas Vencidas
          </h1>
          <p className="text-navy-100">
            Cobranças de aluguel em atraso, com multa e juros calculados automaticamente
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm text-gray-500 mb-1">Parcelas em atraso</p>
            <p className="text-3xl font-bold text-navy-950">{charges.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm text-gray-500 mb-1">Total em atraso (com multa e juros)</p>
            <p className="text-3xl font-bold text-red-600">{formatMoney(totalOverdue)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-600">Carregando...</p>
          ) : charges.length === 0 ? (
            <p className="p-6 text-gray-600">Nenhuma parcela vencida no momento. 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Nome</th>
                    <th className="px-6 py-3">Imóvel</th>
                    <th className="px-6 py-3">Valor</th>
                    <th className="px-6 py-3">Dias de atraso</th>
                    <th className="px-6 py-3">Multa</th>
                    <th className="px-6 py-3">Juros</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((charge) => {
                    const wa = whatsappUrl(charge);
                    const mail = mailtoUrl(charge);
                    return (
                      <tr key={charge.id} className="border-t border-gray-100">
                        <td className="px-6 py-4 font-medium text-navy-950">{charge.tenantName}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {charge.propertyTitle} · {charge.propertyCode}
                        </td>
                        <td className="px-6 py-4 text-gray-900">{formatMoney(charge.amount)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            {charge.daysLate} dia(s)
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{formatMoney(charge.lateFee)}</td>
                        <td className="px-6 py-4 text-gray-600">{formatMoney(charge.interest)}</td>
                        <td className="px-6 py-4 font-bold text-red-600">{formatMoney(charge.total)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
                            {wa ? (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                WhatsApp
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400">Sem telefone</span>
                            )}
                            {mail ? (
                              <>
                                <a
                                  href={mail}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-navy-950 hover:bg-gray-50 transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  Abrir e-mail
                                </a>
                                <button
                                  onClick={() => sendCollectionEmail(charge.id)}
                                  disabled={sendStatus[charge.id] === 'sending'}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
                                  title={
                                    sendStatus[charge.id] && sendStatus[charge.id] !== 'sending' && sendStatus[charge.id] !== 'sent'
                                      ? sendStatus[charge.id]
                                      : undefined
                                  }
                                >
                                  {sendStatus[charge.id] === 'sending' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Mail className="w-3.5 h-3.5" />
                                  )}
                                  {sendStatus[charge.id] === 'sent'
                                    ? 'Enviado'
                                    : sendStatus[charge.id] && sendStatus[charge.id] !== 'sending'
                                      ? 'Erro'
                                      : 'Enviar automático'}
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">Sem e-mail</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
