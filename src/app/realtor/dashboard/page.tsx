'use client';

import { TrendingUp, Home, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import LogoutButton from '@/components/common/LogoutButton';

export default function RealtorDashboard() {
  // Mock realtor data
  const realtorData = {
    name: 'Carlos Mendes',
    email: 'carlos@sbsimoveis.com',
    creci: '123456/SP',
    totalProperties: 12,
    availableProperties: 8,
    soldProperties: 4,
    activeLead: 7,
    totalEarnings: 125000,
    monthlyCommission: 15000,
  };

  // Mock sales data for chart
  const salesData = [
    { month: 'Jan', sales: 2, value: 500000 },
    { month: 'Fev', sales: 3, value: 750000 },
    { month: 'Mar', sales: 1, value: 400000 },
    { month: 'Abr', sales: 2, value: 600000 },
    { month: 'Mai', sales: 4, value: 1200000 },
    { month: 'Jun', sales: 3, value: 900000 },
  ];

  const leadStatusData = [
    { name: 'Novos', value: 2, color: '#3b82f6' },
    { name: 'Em Negociação', value: 3, color: '#f59e0b' },
    { name: 'Perdidos', value: 2, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Dashboard do Corretor</h1>
          <p className="text-blue-100">Bem-vindo, {realtorData.name}!</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Imóveis Cadastrados</p>
                <p className="text-3xl font-bold text-gray-900">{realtorData.totalProperties}</p>
              </div>
              <Home className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Imóveis Disponíveis</p>
                <p className="text-3xl font-bold text-gray-900">{realtorData.availableProperties}</p>
              </div>
              <Home className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Leads Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{realtorData.activeLead}</p>
              </div>
              <Users className="w-12 h-12 text-orange-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ganhos Este Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {realtorData.monthlyCommission.toLocaleString('pt-BR')}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Vendas por Mês</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#1e40af"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Status dos Leads</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link
                  href="/realtor/properties/new"
                  className="px-4 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition text-center font-semibold"
                >
                  + Novo Imóvel
                </Link>
                <Link
                  href="/realtor/properties"
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-semibold"
                >
                  Meus Imóveis
                </Link>
                <Link
                  href="/realtor/leads"
                  className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-center font-semibold"
                >
                  Leads
                </Link>
                <Link
                  href="/realtor/sales"
                  className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-center font-semibold"
                >
                  Vendas
                </Link>
                <Link
                  href="/realtor/commissions"
                  className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-center font-semibold"
                >
                  Comissões
                </Link>
                <Link
                  href="/realtor/reports"
                  className="px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-center font-semibold"
                >
                  Relatórios
                </Link>
              </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Vendas Recentes</h2>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    property: 'Apartamento Pinheiros',
                    value: 850000,
                    commission: 42500,
                    date: '2024-01-15',
                  },
                  {
                    id: 2,
                    property: 'Casa Alphaville',
                    value: 1200000,
                    commission: 60000,
                    date: '2024-01-10',
                  },
                  {
                    id: 3,
                    property: 'Loja Centro',
                    value: 500000,
                    commission: 25000,
                    date: '2024-01-08',
                  },
                ].map((sale) => (
                  <div key={sale.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{sale.property}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(sale.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Valor: R$ {sale.value.toLocaleString('pt-BR')}
                      </span>
                      <span className="font-bold text-green-600">
                        Comissão: R$ {sale.commission.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Meu Perfil</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Nome</p>
                  <p className="text-gray-900 font-medium">{realtorData.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">CRECI</p>
                  <p className="text-gray-900 font-medium">{realtorData.creci}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Ganhos Totais</p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {realtorData.totalEarnings.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <Link
                href="/realtor/profile"
                className="mt-4 w-full py-2 bg-blue-100 text-blue-900 rounded-lg hover:bg-blue-200 transition text-center font-semibold text-sm"
              >
                Editar Perfil
              </Link>
            </div>

            {/* Performance */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Imóveis Vendidos</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{realtorData.soldProperties} vendas</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Leads Convertidos</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">60% de conversão</p>
                </div>
              </div>
            </div>

            {/* Logout */}
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
