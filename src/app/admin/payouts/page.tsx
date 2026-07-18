'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { formatMonthYearBR } from '@/lib/format';

interface Payout {
  id: string;
  competence_date: string;
  rent_amount: number;
  admin_fee_amount: number;
  deductions_amount: number;
  net_amount: number;
  status: string;
  ownerName: string;
  properties?: { title: string; code: string };
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Repassado',
  cancelled: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayouts = () => {
    fetch('/api/admin/payouts')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPayouts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const markAsPaid = async (id: string) => {
    setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'paid' } : p)));
    await fetch(`/api/admin/payouts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    });
    loadPayouts();
  };

  const totalPending = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.net_amount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Repasses a Proprietários</h1>
          <p className="text-navy-100">
            Calculado automaticamente a partir do aluguel recebido, descontando a taxa de administração
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-500">Total pendente de repasse</p>
            <p className="text-2xl font-bold text-navy-950">
              R$ {totalPending.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Proprietário</th>
                  <th className="px-6 py-3">Imóvel</th>
                  <th className="px-6 py-3">Competência</th>
                  <th className="px-6 py-3">Aluguel</th>
                  <th className="px-6 py-3">Taxa Adm.</th>
                  <th className="px-6 py-3">Deduções</th>
                  <th className="px-6 py-3">Líquido</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-t border-gray-100">
                    <td className="px-6 py-4 font-medium text-navy-950">{payout.ownerName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {payout.properties?.title} · {payout.properties?.code}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatMonthYearBR(payout.competence_date)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      R$ {Number(payout.rent_amount).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      - R$ {Number(payout.admin_fee_amount).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      - R$ {Number(payout.deductions_amount).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 font-semibold text-navy-950">
                      R$ {Number(payout.net_amount).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[payout.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUS_LABEL[payout.status] ?? payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payout.status === 'pending' && (
                        <button
                          onClick={() => markAsPaid(payout.id)}
                          className="inline-flex items-center gap-1 text-green-700 hover:text-green-800 font-semibold"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Marcar como repassado
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && payouts.length === 0 && (
            <div className="p-12 text-center text-gray-600">
              Nenhum repasse ainda. Repasses são gerados automaticamente quando uma cobrança de aluguel é
              marcada como paga.
            </div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>
      </div>
    </div>
  );
}
