'use client';

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Home, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/common/LogoutButton';

export default function AdminDashboard() {
  // Mock admin data
  const stats = {
    totalProperties: 156,
    totalClients: 342,
    totalRealtors: 12,
    totalSales: 48,
    grossProfit: 1850000,
    netProfit: 1250000,
    totalCommissions: 450000,
    conversionRate: 45,
  };

  // Sales by month
  const monthlySalesData = [
    { month: 'Jan', sales: 8, value: 3200000, profit: 400000 },
    { month: 'Fev', sales: 6, value: 2400000, profit: 320000 },
    { month: 'Mar', sales: 10, value: 4000000, profit: 600000 },
    { month: 'Abr', sales: 7, value: 2800000, profit: 380000 },
    { month: 'Mai', sales: 12, value: 4800000, profit: 720000 },
    { month: 'Jun', sales: 5, value: 2000000, profit: 250000 },
  ];

  // Realtor performance
  const realtorPerformance = [
    { name: 'Carlos Mendes', sales: 12, value: 4800000, color: '#1e40af' },
    { name: 'Maria Silva', sales: 10, value: 4000000, color: '#2563eb' },
    { name: 'João Santos', sales: 8, value: 3200000, color: '#3b82f6' },
    { name: 'Ana Costa', sales: 6, value: 2400000, color: '#60a5fa' },
    { name: 'Pedro Oliveira', sales: 12, value: 4800000, color: '#93c5fd' },
  ];

  // Lead conversion
  const conversionData = [
    { name: 'Novos Leads', value: 120, fill: '#3b82f6' },
    { name: 'Em Negociação', value: 80, fill: '#f59e0b' },
    { name: 'Convertidos', value: 48, fill: '#10b981' },
  ];

  // Sales by property type
  const propertyTypeSales = [
    { type: 'Apartamento', sales: 18, value: 7200000 },
    { type: 'Casa', sales: 16, value: 6400000 },
    { type: 'Comercial', sales: 8, value: 3200000 },
    { type: 'Terreno', sales: 4, value: 1600000 },
    { type: 'Outro', sales: 2, value: 800000 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
          <p className="text-navy-100">Visão geral da operação - SBS Imóveis</p>
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
            <p className="text-xs text-green-600 mt-2">Referência ao período</p>
          </div>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-sm text-gray-600 mb-2">Lucro Bruto</h3>
            <p className="text-3xl font-bold text-gray-900">
              R$ {(stats.grossProfit / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-green-600 mt-2">Sem descontos</p>
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
              <LineChart data={monthlySalesData}>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={realtorPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#1e40af" name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Conversion Funnel */}
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Funil de Conversão</h3>
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
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Sales by Property Type */}
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Vendas por Tipo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyTypeSales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#f59e0b" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Quick Actions */}
          <div className="lg:col-span-2 card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ações de Gestão</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/properties"
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

          {/* System Status */}
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Status do Sistema</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Banco de Dados</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">API</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Armazenamento</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  Online
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-gray-500">
                  Última atualização: há 2 minutos
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <LogoutButton />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Atividades Recentes</h2>
          <div className="space-y-4">
            {[
              { action: 'Nova venda registrada', detail: 'Apartamento em Pinheiros', time: 'há 2h', user: 'Carlos Mendes' },
              { action: 'Novo cliente cadastrado', detail: 'João Silva', time: 'há 4h', user: 'Sistema' },
              { action: 'Imóvel marcado como vendido', detail: 'Casa em Alphaville', time: 'há 6h', user: 'Maria Silva' },
              { action: 'Novo lead recebido', detail: 'Interesse em comercial', time: 'há 8h', user: 'Website' },
              { action: 'Relatório gerado', detail: 'Vendas mensais', time: 'há 1d', user: 'Admin' },
            ].map((activity, index) => (
              <div key={index} className="border-l-4 border-navy-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.detail}</p>
                    <p className="text-xs text-gray-500 mt-1">Por: {activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
