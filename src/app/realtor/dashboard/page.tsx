'use client';

import { useEffect, useState } from 'react';
import { Home, Users, DollarSign, Key } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import LogoutButton from '@/components/common/LogoutButton';

interface RealtorData {
  name: string;
  email: string;
  creci: string;
  totalProperties: number;
  availableProperties: number;
  soldProperties: number;
  propertiesForRent: number;
  activeLeads: number;
  totalLeads: number;
  convertedLeads: number;
  totalEarnings: number;
  monthlyCommission: number;
}

interface DashboardData {
  realtorData: RealtorData;
  salesData: { month: string; sales: number; value: number }[];
  leadStatusData: { name: string; value: number; color: string }[];
  recentSales: {
    id: string;
    propertyTitle: string;
    sale_value: number;
    commission_value: number;
    sale_date: string;
  }[];
}

export default function RealtorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/realtor/dashboard-stats')
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

  const { realtorData, salesData, leadStatusData, recentSales } = data;
  const soldPct =
    realtorData.totalProperties > 0
      ? Math.round((realtorData.soldProperties / realtorData.totalProperties) * 100)
      : 0;
  const conversionPct =
    realtorData.totalLeads > 0
      ? Math.round((realtorData.convertedLeads / realtorData.totalLeads) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Dashboard do Corretor</h1>
          <p className="text-navy-100">Bem-vindo, {realtorData.name}!</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Imóveis Cadastrados</p>
                <p className="text-3xl font-bold text-gray-900">{realtorData.totalProperties}</p>
              </div>
              <Home className="w-12 h-12 text-navy-500" />
            </div>
          </div>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Imóveis Disponíveis</p>
                <p className="text-3xl font-bold text-gray-900">{realtorData.availableProperties}</p>
              </div>
              <Home className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <Link
            href="/realtor/properties?purpose=rent"
            className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Para Alugar</p>
                <p className="text-3xl font-bold text-gray-900">{realtorData.propertiesForRent}</p>
              </div>
              <Key className="w-12 h-12 text-gold-500" />
            </div>
          </Link>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Leads Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{realtorData.activeLeads}</p>
              </div>
              <Users className="w-12 h-12 text-orange-500" />
            </div>
          </div>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
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
          <div className="lg:col-span-2 card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
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
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Status dos Leads</h3>
            {leadStatusData.length > 0 ? (
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                Nenhum lead recebido ainda.
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link
                  href="/realtor/properties/new"
                  className="px-4 py-3 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition text-center font-semibold"
                >
                  + Novo Imóvel
                </Link>
                <Link
                  href="/realtor/properties"
                  className="px-4 py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition text-center font-semibold"
                >
                  Meus Imóveis
                </Link>
                <Link
                  href="/realtor/documents"
                  className="px-4 py-3 bg-gold-500 text-navy-950 rounded-lg hover:bg-gold-400 transition text-center font-semibold"
                >
                  Documentos
                </Link>
              </div>
            </div>

            {/* Recent Sales */}
            <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Vendas Recentes</h2>
              {recentSales.length > 0 ? (
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="border border-gray-200 rounded-lg p-4 hover:border-navy-500 transition">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{sale.propertyTitle}</h3>
                        <span className="text-xs text-gray-500">
                          {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Valor: R$ {Number(sale.sale_value).toLocaleString('pt-BR')}
                        </span>
                        <span className="font-bold text-green-600">
                          Comissão: R$ {Number(sale.commission_value).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhuma venda registrada ainda.</p>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
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
            </div>

            {/* Performance */}
            <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Imóveis Vendidos</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${soldPct}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{realtorData.soldProperties} vendas</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Leads Convertidos</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-navy-500 h-2 rounded-full" style={{ width: `${conversionPct}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{conversionPct}% de conversão</p>
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
