'use client';

import { useEffect, useState } from 'react';
import { LogOut, Home, Calendar, FileText, Droplets, Zap, Receipt, Shield, Building2 } from 'lucide-react';
import { logoutAction } from '@/lib/auth/actions';
import type { BillingResponsible } from '@/types';
import { formatDateBR } from '@/lib/format';

interface Lease {
  id: string;
  start_date: string;
  end_date: string;
  due_day: number;
  rent_value: number;
  deposit_value: number;
  status: string;
  water_responsible: BillingResponsible;
  energy_responsible: BillingResponsible;
  iptu_responsible: BillingResponsible;
  insurance_responsible: BillingResponsible;
  condo_responsible: BillingResponsible;
  properties?: { title: string; code: string; city: string; neighborhood: string; address: string };
}

interface Charge {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  categoryName: string | null;
  lease_contract_id: string;
}

const RESPONSIBLE_LABEL: Record<BillingResponsible, string> = {
  tenant: 'Você',
  owner: 'Proprietário',
  agency: 'Imobiliária',
  split: 'Dividido',
  not_applicable: 'Não se aplica',
};

const STATUS_LABEL: Record<string, string> = {
  predicted: 'Prevista',
  pending: 'Pendente',
  awaiting_approval: 'Aguardando Aprovação',
  scheduled: 'Agendada',
  paid: 'Paga',
  partially_paid: 'Paga Parcialmente',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
  disputed: 'Contestada',
  refunded: 'Reembolsada',
  draft: 'Rascunho',
  active: 'Ativo',
  expiring_soon: 'Vencendo em breve',
  expired: 'Vencido',
  terminated: 'Encerrado',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
  active: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-600',
  expiring_soon: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
  terminated: 'bg-gray-100 text-gray-500',
};

const billingRows: { key: keyof Lease; label: string; icon: typeof Droplets }[] = [
  { key: 'water_responsible', label: 'Água', icon: Droplets },
  { key: 'energy_responsible', label: 'Energia', icon: Zap },
  { key: 'iptu_responsible', label: 'IPTU', icon: Receipt },
  { key: 'insurance_responsible', label: 'Seguro', icon: Shield },
  { key: 'condo_responsible', label: 'Condomínio', icon: Building2 },
];

export default function TenantDashboardPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/tenant/dashboard')
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Erro ao carregar dados.');
        }
        return res.json();
      })
      .then((data) => {
        setLeases(data.leases ?? []);
        setCharges(data.charges ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const activeLease = leases.find((l) => l.status === 'active') ?? leases[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <form action={logoutAction}>
            <button className="text-navy-600 font-semibold hover:underline">Sair</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meu Aluguel</h1>
            <p className="text-navy-100">Acompanhe seu contrato e cobranças</p>
          </div>
          <form action={logoutAction}>
            <button className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors">
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-8">
        {!activeLease && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-600">
            Nenhum contrato de locação encontrado.
          </div>
        )}

        {activeLease && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-navy-50 flex items-center justify-center">
                  <Home className="w-6 h-6 text-navy-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy-950">{activeLease.properties?.title}</h2>
                  <p className="text-sm text-gray-500">
                    {activeLease.properties?.address}, {activeLease.properties?.neighborhood} —{' '}
                    {activeLease.properties?.city}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[activeLease.status] ?? 'bg-gray-100 text-gray-700'}`}
              >
                {STATUS_LABEL[activeLease.status] ?? activeLease.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Aluguel Mensal</p>
                <p className="font-bold text-navy-950">
                  R$ {Number(activeLease.rent_value).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Vencimento</p>
                <p className="font-bold text-navy-950">Dia {activeLease.due_day}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Início
                </p>
                <p className="font-bold text-navy-950">
                  {formatDateBR(activeLease.start_date)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Término
                </p>
                <p className="font-bold text-navy-950">
                  {formatDateBR(activeLease.end_date)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Responsabilidade pelas contas</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {billingRows.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                    <Icon className="w-4 h-4 text-navy-500" />
                    <div>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-xs font-semibold text-navy-950">
                        {RESPONSIBLE_LABEL[activeLease[key] as BillingResponsible]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-navy-600" />
            <h3 className="font-bold text-navy-950">Minhas Cobranças</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Descrição</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Vencimento</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id} className="border-t border-gray-100">
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-950">{charge.description}</p>
                      <p className="text-xs text-gray-500">{charge.categoryName}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-navy-950">
                      R$ {Number(charge.amount).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDateBR(charge.due_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[charge.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUS_LABEL[charge.status] ?? charge.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {charges.length === 0 && (
            <div className="p-12 text-center text-gray-600">Nenhuma cobrança registrada ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}
