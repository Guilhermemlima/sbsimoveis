'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Home, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/common/LogoutButton';

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

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard-stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

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
            </div>
          </div>

          <div className="lg:col-span-3">
            <LogoutButton />
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
