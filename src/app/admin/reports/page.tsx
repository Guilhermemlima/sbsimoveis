'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { downloadCSV } from '@/lib/export';
import { formatDateBR } from '@/lib/format';
import PrintHeader from '@/components/common/PrintHeader';

interface Sale {
  id: string;
  realtor_id: string;
  realtorName: string;
  sale_value: number;
  commission_value: number;
  net_profit: number;
  sale_date: string;
  properties?: { title: string; code: string };
}

interface RentalTransaction {
  id: string;
  type: string;
  center: string;
  categoryName: string | null;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  properties?: { title: string; code: string };
}

interface Payout {
  id: string;
  ownerName: string;
  competence_date: string;
  net_amount: number;
  status: string;
  properties?: { title: string; code: string };
}

interface RentalSummary {
  rentCollected: number;
  adminFeeRevenue: number;
  firstRentRetentionRevenue: number;
  rentalExpensesPaid: number;
  adminExpensesPaid: number;
  adminExpensesPending: number;
  payoutsPaid: number;
  payoutsPending: number;
  agencyNetResult: number;
}

interface InspectionRow {
  id: string;
  type: string;
  custom_type_label: string | null;
  status: string;
  scheduled_date: string | null;
  performed_date: string | null;
  inspector_signature_name: string | null;
  ownerName: string | null;
  tenantName: string | null;
  properties?: { title: string; code: string };
}

interface MaintenanceRow {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  responsibility: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_at: string;
  properties?: { title: string; code: string };
}

interface AmendmentRow {
  id: string;
  title: string;
  type: string;
  version: number;
  status: string;
  effective_date: string | null;
  created_at: string;
  lease_contracts?: { properties?: { title: string; code: string } };
}

const INSPECTION_TYPE_LABEL: Record<string, string> = {
  entry: 'Entrada',
  exit: 'Saída',
  periodic: 'Periódica',
  emergency: 'Emergencial',
  maintenance: 'Manutenção',
  custom: 'Personalizada',
};

const MAINTENANCE_CATEGORY_LABEL: Record<string, string> = {
  plumbing: 'Hidráulica',
  electrical: 'Elétrica',
  structural: 'Estrutural',
  appliance: 'Eletrodoméstico',
  hvac: 'Ar-condicionado/Climatização',
  pest_control: 'Controle de pragas',
  painting: 'Pintura',
  locksmith: 'Chaveiro/Fechadura',
  other: 'Outro',
};

const AMENDMENT_TYPE_LABEL: Record<string, string> = {
  rent_adjustment: 'Reajuste de Aluguel',
  term_extension: 'Prorrogação de Prazo',
  responsibility_change: 'Alteração de Responsabilidades',
  tenant_change: 'Substituição de Inquilino',
  owner_change: 'Substituição de Proprietário',
  other: 'Outro',
};

type Period = 'month' | 'quarter' | 'all';
type Tab = 'sales' | 'rental' | 'inspections' | 'maintenance' | 'amendments';

export default function AdminReportsPage() {
  const [tab, setTab] = useState<Tab>('sales');
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [rentalSummary, setRentalSummary] = useState<RentalSummary | null>(null);
  const [rentalTransactions, setRentalTransactions] = useState<RentalTransaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [inspections, setInspections] = useState<InspectionRow[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRow[]>([]);
  const [amendments, setAmendments] = useState<AmendmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('all');

  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => setCurrentUser(me));

    fetch('/api/admin/sales')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSales(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));

    fetch('/api/admin/reports/rental')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setRentalSummary(data.summary);
        setRentalTransactions(data.transactions ?? []);
        setPayouts(data.payouts ?? []);
      });

    fetch('/api/admin/inspections')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setInspections(Array.isArray(data) ? data : []));

    fetch('/api/admin/maintenance')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMaintenanceRequests(Array.isArray(data) ? data : []));

    fetch('/api/admin/amendments')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAmendments(Array.isArray(data) ? data : []));
  }, []);

  const filteredSales = useMemo(() => {
    if (period === 'all') return sales;
    const now = new Date();
    const cutoff = new Date(now);
    if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
    if (period === 'quarter') cutoff.setMonth(now.getMonth() - 3);
    return sales.filter((s) => new Date(s.sale_date) >= cutoff);
  }, [sales, period]);

  const totals = useMemo(() => {
    return {
      count: filteredSales.length,
      value: filteredSales.reduce((sum, s) => sum + Number(s.sale_value), 0),
      commission: filteredSales.reduce((sum, s) => sum + Number(s.commission_value), 0),
      netProfit: filteredSales.reduce((sum, s) => sum + Number(s.net_profit), 0),
    };
  }, [filteredSales]);

  const byRealtor = useMemo(() => {
    const groups = new Map<string, { name: string; count: number; value: number; commission: number }>();
    for (const sale of filteredSales) {
      const existing = groups.get(sale.realtor_id) ?? {
        name: sale.realtorName,
        count: 0,
        value: 0,
        commission: 0,
      };
      existing.count += 1;
      existing.value += Number(sale.sale_value);
      existing.commission += Number(sale.commission_value);
      groups.set(sale.realtor_id, existing);
    }
    return [...groups.values()].sort((a, b) => b.value - a.value);
  }, [filteredSales]);

  const exportSalesCSV = () => {
    downloadCSV(
      `vendas-${period}`,
      ['Imóvel', 'Código', 'Corretor', 'Valor da Venda', 'Comissão', 'Lucro Líquido', 'Data'],
      filteredSales.map((s) => [
        s.properties?.title ?? '',
        s.properties?.code ?? '',
        s.realtorName,
        Number(s.sale_value).toFixed(2),
        Number(s.commission_value).toFixed(2),
        Number(s.net_profit).toFixed(2),
        formatDateBR(s.sale_date),
      ])
    );
  };

  const exportRentalCSV = () => {
    downloadCSV(
      'financeiro-locacao',
      ['Imóvel', 'Código', 'Categoria', 'Descrição', 'Valor', 'Vencimento', 'Status'],
      rentalTransactions.map((t) => [
        t.properties?.title ?? '',
        t.properties?.code ?? '',
        t.categoryName ?? '',
        t.description,
        Number(t.amount).toFixed(2),
        formatDateBR(t.due_date),
        t.status,
      ])
    );
  };

  const inspectionsSummary = useMemo(() => {
    const total = inspections.length;
    const completed = inspections.filter((i) => i.status === 'completed').length;
    return { total, completed, open: total - completed };
  }, [inspections]);

  const exportInspectionsCSV = () => {
    downloadCSV(
      'vistorias',
      ['Imóvel', 'Código', 'Tipo', 'Status', 'Data', 'Vistoriador', 'Proprietário', 'Inquilino'],
      inspections.map((i) => [
        i.properties?.title ?? '',
        i.properties?.code ?? '',
        i.type === 'custom' ? (i.custom_type_label ?? 'Personalizada') : (INSPECTION_TYPE_LABEL[i.type] ?? i.type),
        i.status,
        i.performed_date ? formatDateBR(i.performed_date) : i.scheduled_date ? formatDateBR(i.scheduled_date) : '',
        i.inspector_signature_name ?? '',
        i.ownerName ?? '',
        i.tenantName ?? '',
      ])
    );
  };

  const maintenanceSummary = useMemo(() => {
    const total = maintenanceRequests.length;
    const completed = maintenanceRequests.filter((m) => m.status === 'completed');
    const totalCost = completed.reduce((sum, m) => sum + Number(m.actual_cost ?? 0), 0);
    return {
      total,
      completed: completed.length,
      open: total - completed.length,
      totalCost,
      averageCost: completed.length > 0 ? totalCost / completed.length : 0,
    };
  }, [maintenanceRequests]);

  const exportMaintenanceCSV = () => {
    downloadCSV(
      'manutencao',
      ['Imóvel', 'Código', 'Título', 'Categoria', 'Prioridade', 'Status', 'Responsabilidade', 'Custo'],
      maintenanceRequests.map((m) => [
        m.properties?.title ?? '',
        m.properties?.code ?? '',
        m.title,
        MAINTENANCE_CATEGORY_LABEL[m.category] ?? m.category,
        m.priority,
        m.status,
        m.responsibility,
        m.actual_cost != null ? Number(m.actual_cost).toFixed(2) : m.estimated_cost != null ? `~${Number(m.estimated_cost).toFixed(2)}` : '',
      ])
    );
  };

  const amendmentsSummary = useMemo(() => {
    const total = amendments.length;
    const signed = amendments.filter((a) => a.status === 'signed').length;
    const pendingSignature = amendments.filter((a) => a.status === 'pending_signature').length;
    return { total, signed, pendingSignature };
  }, [amendments]);

  const exportAmendmentsCSV = () => {
    downloadCSV(
      'aditivos',
      ['Imóvel', 'Código', 'Título', 'Tipo', 'Versão', 'Status', 'Vigência'],
      amendments.map((a) => [
        a.lease_contracts?.properties?.title ?? '',
        a.lease_contracts?.properties?.code ?? '',
        a.title,
        AMENDMENT_TYPE_LABEL[a.type] ?? a.type,
        a.version,
        a.status,
        a.effective_date ? formatDateBR(a.effective_date) : '',
      ])
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href={currentUser?.role === 'realtor' ? '/realtor/dashboard' : '/admin/dashboard'}
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm no-print"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
          <p className="text-navy-100">Vendas e financeiro da locação, com base em dados reais</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <PrintHeader subtitle={`Relatório gerado em ${formatDateBR(new Date().toISOString().slice(0, 10))}`} />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 no-print">
          <div className="inline-flex p-1 rounded-lg bg-white shadow border border-gray-100">
            {(currentUser?.role === 'realtor'
              ? ([['sales', 'Vendas']] as [Tab, string][])
              : ([
                  ['sales', 'Vendas'],
                  ['rental', 'Locação'],
                  ['inspections', 'Vistorias'],
                  ['maintenance', 'Manutenção'],
                  ['amendments', 'Aditivos'],
                ] as [Tab, string][])
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-pressed={tab === key}
                className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  tab === key ? 'bg-navy-900 text-white' : 'text-gray-600 hover:text-navy-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={
                tab === 'sales'
                  ? exportSalesCSV
                  : tab === 'rental'
                    ? exportRentalCSV
                    : tab === 'inspections'
                      ? exportInspectionsCSV
                      : tab === 'maintenance'
                        ? exportMaintenanceCSV
                        : exportAmendmentsCSV
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {tab === 'sales' && (
          <>
            <div className="inline-flex mb-8 p-1 rounded-lg bg-white shadow border border-gray-100 no-print">
              {([
                ['month', 'Último mês'],
                ['quarter', 'Últimos 3 meses'],
                ['all', 'Tudo'],
              ] as [Period, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  aria-pressed={period === key}
                  className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                    period === key ? 'bg-navy-900 text-white' : 'text-gray-600 hover:text-navy-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Vendas no período</p>
                <p className="text-3xl font-bold text-gray-900">{totals.count}</p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Valor total vendido</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totals.value.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Comissões</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totals.commission.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Lucro líquido</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totals.netProfit.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Desempenho por Corretor</h2>
              {byRealtor.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="py-3 text-sm font-semibold text-gray-600">Corretor</th>
                        <th className="py-3 text-sm font-semibold text-gray-600">Vendas</th>
                        <th className="py-3 text-sm font-semibold text-gray-600">Valor Total</th>
                        <th className="py-3 text-sm font-semibold text-gray-600">Comissão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {byRealtor.map((r) => (
                        <tr key={r.name}>
                          <td className="py-3 font-medium text-navy-950">{r.name}</td>
                          <td className="py-3 text-gray-700">{r.count}</td>
                          <td className="py-3 text-gray-700">R$ {r.value.toLocaleString('pt-BR')}</td>
                          <td className="py-3 text-green-600 font-semibold">
                            R$ {r.commission.toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                !loading && (
                  <p className="text-gray-500 text-sm">
                    Nenhuma venda registrada nesse período.{' '}
                    <Link href="/admin/sales" className="text-gold-600 hover:underline">
                      Registrar venda
                    </Link>
                  </p>
                )
              )}
            </div>
          </>
        )}

        {tab === 'rental' && rentalSummary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Aluguel recebido</p>
                <p className="text-xl font-bold text-gray-900">
                  R$ {rentalSummary.rentCollected.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Taxa de administração (lucro)</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {rentalSummary.adminFeeRevenue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Receita — taxa do primeiro aluguel</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {rentalSummary.firstRentRetentionRevenue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Repasses pagos / pendentes</p>
                <p className="text-xl font-bold text-gray-900">
                  R$ {rentalSummary.payoutsPaid.toLocaleString('pt-BR')} / R${' '}
                  {rentalSummary.payoutsPending.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Despesas pagas / pendentes</p>
                <p className="text-xl font-bold text-gray-900">
                  R$ {rentalSummary.adminExpensesPaid.toLocaleString('pt-BR')} / R${' '}
                  {rentalSummary.adminExpensesPending.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent md:col-span-4">
                <p className="text-gray-600 text-sm mb-1">Resultado líquido da imobiliária (taxa − despesas)</p>
                <p
                  className={`text-2xl font-bold ${rentalSummary.agencyNetResult >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  R$ {rentalSummary.agencyNetResult.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Repasses a Proprietários</h2>
              {payouts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="py-3 font-semibold text-gray-600">Proprietário</th>
                        <th className="py-3 font-semibold text-gray-600">Imóvel</th>
                        <th className="py-3 font-semibold text-gray-600">Competência</th>
                        <th className="py-3 font-semibold text-gray-600">Líquido</th>
                        <th className="py-3 font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payouts.map((p) => (
                        <tr key={p.id}>
                          <td className="py-3 font-medium text-navy-950">{p.ownerName}</td>
                          <td className="py-3 text-gray-700">
                            {p.properties?.title} · {p.properties?.code}
                          </td>
                          <td className="py-3 text-gray-700">{formatDateBR(p.competence_date)}</td>
                          <td className="py-3 text-gray-700">R$ {Number(p.net_amount).toLocaleString('pt-BR')}</td>
                          <td className="py-3 text-gray-700 capitalize">{p.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum repasse gerado ainda.</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Lançamentos Financeiros</h2>
              {rentalTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="py-3 font-semibold text-gray-600">Imóvel</th>
                        <th className="py-3 font-semibold text-gray-600">Categoria</th>
                        <th className="py-3 font-semibold text-gray-600">Descrição</th>
                        <th className="py-3 font-semibold text-gray-600">Valor</th>
                        <th className="py-3 font-semibold text-gray-600">Vencimento</th>
                        <th className="py-3 font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rentalTransactions.map((t) => (
                        <tr key={t.id}>
                          <td className="py-3 text-gray-700">
                            {t.properties?.title ?? '—'} {t.properties?.code ? `· ${t.properties.code}` : ''}
                          </td>
                          <td className="py-3 text-gray-700">{t.categoryName}</td>
                          <td className="py-3 text-gray-700">{t.description}</td>
                          <td className="py-3 text-gray-700">R$ {Number(t.amount).toLocaleString('pt-BR')}</td>
                          <td className="py-3 text-gray-700">{formatDateBR(t.due_date)}</td>
                          <td className="py-3 text-gray-700 capitalize">{t.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum lançamento ainda.</p>
              )}
            </div>
          </>
        )}

        {tab === 'inspections' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Total de vistorias</p>
                <p className="text-3xl font-bold text-gray-900">{inspectionsSummary.total}</p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{inspectionsSummary.completed}</p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Em aberto</p>
                <p className="text-2xl font-bold text-gray-900">{inspectionsSummary.open}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Vistorias</h2>
              {inspections.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="py-3 font-semibold text-gray-600">Imóvel</th>
                        <th className="py-3 font-semibold text-gray-600">Tipo</th>
                        <th className="py-3 font-semibold text-gray-600">Status</th>
                        <th className="py-3 font-semibold text-gray-600">Data</th>
                        <th className="py-3 font-semibold text-gray-600">Vistoriador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inspections.map((i) => (
                        <tr key={i.id}>
                          <td className="py-3 text-gray-700">
                            {i.properties?.title ?? '—'} {i.properties?.code ? `· ${i.properties.code}` : ''}
                          </td>
                          <td className="py-3 text-gray-700">
                            {i.type === 'custom'
                              ? (i.custom_type_label ?? 'Personalizada')
                              : (INSPECTION_TYPE_LABEL[i.type] ?? i.type)}
                          </td>
                          <td className="py-3 text-gray-700 capitalize">{i.status}</td>
                          <td className="py-3 text-gray-700">
                            {i.performed_date
                              ? formatDateBR(i.performed_date)
                              : i.scheduled_date
                                ? formatDateBR(i.scheduled_date)
                                : '—'}
                          </td>
                          <td className="py-3 text-gray-700">{i.inspector_signature_name ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhuma vistoria registrada ainda.</p>
              )}
            </div>
          </>
        )}

        {tab === 'maintenance' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Total de solicitações</p>
                <p className="text-2xl font-bold text-gray-900">{maintenanceSummary.total}</p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{maintenanceSummary.completed}</p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Em aberto</p>
                <p className="text-2xl font-bold text-gray-900">{maintenanceSummary.open}</p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Custo total</p>
                <p className="text-xl font-bold text-gray-900">
                  R$ {maintenanceSummary.totalCost.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Custo médio</p>
                <p className="text-xl font-bold text-gray-900">
                  R$ {maintenanceSummary.averageCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Manutenção</h2>
              {maintenanceRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="py-3 font-semibold text-gray-600">Imóvel</th>
                        <th className="py-3 font-semibold text-gray-600">Título</th>
                        <th className="py-3 font-semibold text-gray-600">Categoria</th>
                        <th className="py-3 font-semibold text-gray-600">Status</th>
                        <th className="py-3 font-semibold text-gray-600">Responsabilidade</th>
                        <th className="py-3 font-semibold text-gray-600">Custo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {maintenanceRequests.map((m) => (
                        <tr key={m.id}>
                          <td className="py-3 text-gray-700">
                            {m.properties?.title ?? '—'} {m.properties?.code ? `· ${m.properties.code}` : ''}
                          </td>
                          <td className="py-3 text-gray-700">{m.title}</td>
                          <td className="py-3 text-gray-700">
                            {MAINTENANCE_CATEGORY_LABEL[m.category] ?? m.category}
                          </td>
                          <td className="py-3 text-gray-700 capitalize">{m.status}</td>
                          <td className="py-3 text-gray-700 capitalize">{m.responsibility}</td>
                          <td className="py-3 text-gray-700">
                            {m.actual_cost != null
                              ? `R$ ${Number(m.actual_cost).toLocaleString('pt-BR')}`
                              : m.estimated_cost != null
                                ? `~R$ ${Number(m.estimated_cost).toLocaleString('pt-BR')}`
                                : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhuma solicitação de manutenção registrada.</p>
              )}
            </div>
          </>
        )}

        {tab === 'amendments' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Total de aditivos</p>
                <p className="text-3xl font-bold text-gray-900">{amendmentsSummary.total}</p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Assinados</p>
                <p className="text-2xl font-bold text-green-600">{amendmentsSummary.signed}</p>
              </div>
              <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent">
                <p className="text-gray-600 text-sm mb-1">Aguardando assinatura</p>
                <p className="text-2xl font-bold text-yellow-600">{amendmentsSummary.pendingSignature}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Aditivos Contratuais</h2>
              {amendments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="py-3 font-semibold text-gray-600">Imóvel</th>
                        <th className="py-3 font-semibold text-gray-600">Título</th>
                        <th className="py-3 font-semibold text-gray-600">Tipo</th>
                        <th className="py-3 font-semibold text-gray-600">Versão</th>
                        <th className="py-3 font-semibold text-gray-600">Status</th>
                        <th className="py-3 font-semibold text-gray-600">Vigência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {amendments.map((a) => (
                        <tr key={a.id}>
                          <td className="py-3 text-gray-700">
                            {a.lease_contracts?.properties?.title ?? '—'}{' '}
                            {a.lease_contracts?.properties?.code ? `· ${a.lease_contracts.properties.code}` : ''}
                          </td>
                          <td className="py-3 text-gray-700">{a.title}</td>
                          <td className="py-3 text-gray-700">{AMENDMENT_TYPE_LABEL[a.type] ?? a.type}</td>
                          <td className="py-3 text-gray-700">v{a.version}</td>
                          <td className="py-3 text-gray-700 capitalize">{a.status}</td>
                          <td className="py-3 text-gray-700">
                            {a.effective_date ? formatDateBR(a.effective_date) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum aditivo registrado ainda.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
