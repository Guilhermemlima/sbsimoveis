'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Home, Users, DollarSign, BellRing, AlertTriangle, Wrench, ClipboardCheck, FileEdit, Percent } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/common/LogoutButton';

interface ScheduleItem {
  id: string;
  kind: string;
  date: string;
}

function toLocalDate(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface DashboardStats {
  totalProperties: number;
  availableProperties: number;
  soldProperties: number;
  rentedProperties: number;
  totalRealtors: number;
  totalClients: number;
  totalSales: number;
  grossProfit: number;
  netProfit: number;
  totalCommissions: number;
  conversionRate: number;
}

interface DashboardData {
  stats: DashboardStats;
  monthlySales: { month: string; sales: number; value: number; profit: number }[];
  realtorPerformance: { name: string; sales: number; value: number }[];
  conversionData: { name: string; value: number }[];
  propertyTypeSales: { type: string; sales: number; value: number }[];
  recentLeads: { id: string; name: string; status: string; source: string; created_at: string }[];
}

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6'];

interface OperationalAlerts {
  contractsExpiringSoon: { lease_contract_id: string; property?: { title: string; code: string }; days_until_end: number }[];
  rentAdjustmentOverdue: { lease_contract_id: string; property?: { title: string; code: string }; days_since_last_adjustment: number }[];
  maintenanceAwaitingReview: { id: string; title: string; priority: string; properties?: { title: string; code: string } }[];
  inspectionsPending: { id: string; type: string; status: string; properties?: { title: string; code: string } }[];
  amendmentsPendingSignature: {
    id: string;
    title: string;
    lease_contracts?: { properties?: { title: string; code: string } };
  }[];
  occupancy: { total: number; occupied: number };
  counts: {
    contractsExpiringSoon: number;
    rentAdjustmentOverdue: number;
    maintenanceAwaitingReview: number;
    inspectionsPending: number;
    amendmentsPendingSignature: number;
    overdueRentCharges: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlerts | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard-stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) setData(json);
      })
      .finally(() => setLoading(false));

    fetch('/api/admin/schedule')
      .then((res) => (res.ok ? res.json() : []))
      .then((items) => setScheduleItems(Array.isArray(items) ? items : []));

    fetch('/api/admin/alerts')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setAlerts(json));
  }, []);

  const notifications = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    let overdue = 0;
    let dueSoon = 0;
    for (const item of scheduleItems) {
      const date = toLocalDate(item.date);
      if (date < today) overdue += 1;
      else if (date <= weekFromNow) dueSoon += 1;
    }
    return { overdue, dueSoon, total: overdue + dueSoon };
  })();

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando dashboard...</p>
      </div>
    );
  }

  const { stats, monthlySales, realtorPerformance, conversionData, propertyTypeSales, recentLeads } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
            <p className="text-navy-100">Visão geral da operação - SBS Imóveis</p>
          </div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            <Users className="w-5 h-5" />
            Gerenciar Usuários
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Quick Actions */}
          <div className="lg:col-span-2 card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ações de Gestão</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/realtor/properties"
                className="px-4 py-3 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition text-center font-semibold text-sm"
              >
                Imóveis
              </Link>
              <Link
                href="/admin/realtors"
                className="px-4 py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition text-center font-semibold text-sm"
              >
                Corretores
              </Link>
              <Link
                href="/admin/clients"
                className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-center font-semibold text-sm"
              >
                Clientes
              </Link>
              <Link
                href="/admin/sales"
                className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-center font-semibold text-sm"
              >
                Vendas
              </Link>
              <Link
                href="/admin/carousel"
                className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-center font-semibold text-sm"
              >
                Carrossel
              </Link>
              <Link
                href="/admin/reports"
                className="px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-center font-semibold text-sm"
              >
                Relatórios
              </Link>
              <Link
                href="/admin/settings"
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-center font-semibold text-sm"
              >
                Configurações
              </Link>
              <Link
                href="/admin/users"
                className="px-4 py-3 bg-navy-400 text-white rounded-lg hover:bg-navy-500 transition text-center font-semibold text-sm"
              >
                Usuários
              </Link>
              <Link
                href="/admin/leases"
                className="px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-center font-semibold text-sm"
              >
                Contratos de Locação
              </Link>
              <Link
                href="/admin/owners"
                className="px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-center font-semibold text-sm"
              >
                Proprietários
              </Link>
              <Link
                href="/admin/tenants"
                className="px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-center font-semibold text-sm"
              >
                Inquilinos
              </Link>
              <Link
                href="/admin/rent-charges"
                className="px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-center font-semibold text-sm"
              >
                Cobranças de Locação
              </Link>
              <Link
                href="/admin/payouts"
                className="px-4 py-3 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition text-center font-semibold text-sm"
              >
                Repasses a Proprietários
              </Link>
              <Link
                href="/admin/expenses"
                className="px-4 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition text-center font-semibold text-sm"
              >
                Despesas
              </Link>
              <Link
                href="/admin/audit-log"
                className="px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition text-center font-semibold text-sm"
              >
                Auditoria
              </Link>
              <Link
                href="/admin/schedule"
                className="px-4 py-3 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 transition text-center font-semibold text-sm"
              >
                Cronograma Financeiro
              </Link>
              <Link
                href="/realtor/documents"
                className="px-4 py-3 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition text-center font-semibold text-sm"
              >
                Documentos
              </Link>
              <Link
                href="/admin/inspections"
                className="px-4 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition text-center font-semibold text-sm"
              >
                Vistorias
              </Link>
              <Link
                href="/admin/maintenance"
                className="px-4 py-3 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition text-center font-semibold text-sm"
              >
                Manutenção
              </Link>
              <Link
                href="/admin/amendments"
                className="px-4 py-3 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 transition text-center font-semibold text-sm"
              >
                Aditivos
              </Link>
            </div>
          </div>

          <div className="lg:col-span-3">
            <LogoutButton />
          </div>
        </div>

        {notifications.total > 0 && (
          <Link
            href="/admin/schedule"
            className="flex items-center justify-between gap-4 mb-10 p-5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-navy-950">
                  {notifications.overdue > 0 && (
                    <span className="text-red-700">{notifications.overdue} vencido(s)</span>
                  )}
                  {notifications.overdue > 0 && notifications.dueSoon > 0 && ' · '}
                  {notifications.dueSoon > 0 && `${notifications.dueSoon} vencendo nos próximos 7 dias`}
                </p>
                <p className="text-sm text-gray-600">
                  Cobranças, despesas, repasses e contratos precisando de atenção
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-navy-950 whitespace-nowrap">Ver cronograma →</span>
          </Link>
        )}

        {alerts && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-navy-950 mb-4">Painel Operacional de Locação</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
              <div className="bg-white p-4 rounded-xl shadow border border-transparent">
                <div className="flex items-center justify-between mb-1">
                  <Percent className="w-5 h-5 text-navy-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.occupancy.total > 0
                    ? Math.round((alerts.occupancy.occupied / alerts.occupancy.total) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-gray-600">
                  Ocupação ({alerts.occupancy.occupied}/{alerts.occupancy.total})
                </p>
              </div>

              <Link
                href="/admin/rent-charges"
                className={`p-4 rounded-xl shadow border transition ${alerts.counts.overdueRentCharges > 0 ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-white border-transparent'}`}
              >
                <AlertTriangle className={`w-5 h-5 mb-1 ${alerts.counts.overdueRentCharges > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                <p className="text-2xl font-bold text-gray-900">{alerts.counts.overdueRentCharges}</p>
                <p className="text-xs text-gray-600">Aluguéis em atraso</p>
              </Link>

              <Link
                href="/admin/leases"
                className={`p-4 rounded-xl shadow border transition ${alerts.counts.contractsExpiringSoon > 0 ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-white border-transparent'}`}
              >
                <Home className={`w-5 h-5 mb-1 ${alerts.counts.contractsExpiringSoon > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                <p className="text-2xl font-bold text-gray-900">{alerts.counts.contractsExpiringSoon}</p>
                <p className="text-xs text-gray-600">Contratos vencendo em 60 dias</p>
              </Link>

              <Link
                href="/admin/leases"
                className={`p-4 rounded-xl shadow border transition ${alerts.counts.rentAdjustmentOverdue > 0 ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-white border-transparent'}`}
              >
                <TrendingUp className={`w-5 h-5 mb-1 ${alerts.counts.rentAdjustmentOverdue > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                <p className="text-2xl font-bold text-gray-900">{alerts.counts.rentAdjustmentOverdue}</p>
                <p className="text-xs text-gray-600">Sem reajuste há 12+ meses</p>
              </Link>

              <Link
                href="/admin/maintenance"
                className={`p-4 rounded-xl shadow border transition ${alerts.counts.maintenanceAwaitingReview > 0 ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' : 'bg-white border-transparent'}`}
              >
                <Wrench className={`w-5 h-5 mb-1 ${alerts.counts.maintenanceAwaitingReview > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                <p className="text-2xl font-bold text-gray-900">{alerts.counts.maintenanceAwaitingReview}</p>
                <p className="text-xs text-gray-600">Manutenções aguardando análise</p>
              </Link>

              <Link
                href="/admin/inspections"
                className={`p-4 rounded-xl shadow border transition ${alerts.counts.inspectionsPending > 0 ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'bg-white border-transparent'}`}
              >
                <ClipboardCheck className={`w-5 h-5 mb-1 ${alerts.counts.inspectionsPending > 0 ? 'text-emerald-600' : 'text-gray-400'}`} />
                <p className="text-2xl font-bold text-gray-900">{alerts.counts.inspectionsPending}</p>
                <p className="text-xs text-gray-600">Vistorias pendentes</p>
              </Link>
            </div>

            {alerts.counts.amendmentsPendingSignature > 0 && (
              <Link
                href="/admin/amendments"
                className="flex items-center gap-3 p-4 rounded-xl border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 transition mb-4"
              >
                <FileEdit className="w-5 h-5 text-cyan-700" />
                <p className="text-sm font-semibold text-navy-950">
                  {alerts.counts.amendmentsPendingSignature} aditivo(s) aguardando assinatura
                </p>
              </Link>
            )}

            {(alerts.contractsExpiringSoon.length > 0 || alerts.rentAdjustmentOverdue.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.contractsExpiringSoon.length > 0 && (
                  <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
                    <p className="text-sm font-bold text-navy-950 mb-2">Próximos vencimentos</p>
                    <ul className="space-y-1">
                      {alerts.contractsExpiringSoon.slice(0, 5).map((c) => (
                        <li key={c.lease_contract_id} className="text-xs text-gray-600 flex justify-between">
                          <span>
                            {c.property?.title} · {c.property?.code}
                          </span>
                          <span className="font-semibold">{c.days_until_end} dia(s)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {alerts.rentAdjustmentOverdue.length > 0 && (
                  <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
                    <p className="text-sm font-bold text-navy-950 mb-2">Sem reajuste há mais tempo</p>
                    <ul className="space-y-1">
                      {alerts.rentAdjustmentOverdue.slice(0, 5).map((c) => (
                        <li key={c.lease_contract_id} className="text-xs text-gray-600 flex justify-between">
                          <span>
                            {c.property?.title} · {c.property?.code}
                          </span>
                          <span className="font-semibold">{Math.round(c.days_since_last_adjustment / 30)} mês(es)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Imóveis</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProperties}</p>
              </div>
              <Home className="w-12 h-12 text-navy-500" />
            </div>
          </div>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
              <Users className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Lucro Líquido</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {(stats.netProfit / 1000000).toFixed(1)}M
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-sm text-gray-600 mb-2">Total de Vendas</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalSales}</p>
          </div>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-sm text-gray-600 mb-2">Lucro Bruto</h3>
            <p className="text-3xl font-bold text-gray-900">
              R$ {(stats.grossProfit / 1000000).toFixed(1)}M
            </p>
          </div>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-sm text-gray-600 mb-2">Total de Comissões</h3>
            <p className="text-3xl font-bold text-gray-900">
              R$ {(stats.totalCommissions / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-navy-600 mt-2">Pago aos corretores</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Monthly Sales */}
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Vendas Mensais</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#1e40af" strokeWidth={2} name="Quantidade" />
                <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Lucro" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Realtor Performance */}
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Top Corretores</h3>
            {realtorPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={realtorPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#1e40af" name="Vendas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                Nenhuma venda registrada ainda.
              </div>
            )}
          </div>

          {/* Lead Conversion Funnel */}
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Funil de Conversão</h3>
            {conversionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={conversionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                Nenhum lead recebido ainda.
              </div>
            )}
          </div>

          {/* Sales by Property Type */}
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Vendas por Tipo</h3>
            {propertyTypeSales.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={propertyTypeSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#f59e0b" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                Nenhuma venda registrada ainda.
              </div>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Leads Recentes</h2>
          {recentLeads.length > 0 ? (
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="border-l-4 border-navy-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{lead.name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        Origem: {lead.source} · Status: {lead.status}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhum lead recebido ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
