'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, TrendingUp, Users } from 'lucide-react';

interface RealtorStats {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  creci: string | null;
  commissionRate: number;
  status: string;
  totalProperties: number;
  availableProperties: number;
  soldProperties: number;
  totalSales: number;
  totalCommission: number;
  totalSalesValue: number;
}

export default function AdminRealtorsPage() {
  const [realtors, setRealtors] = useState<RealtorStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/realtors')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRealtors(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-2">Corretores</h1>
            <p className="text-navy-100">Performance de imóveis e vendas por corretor</p>
          </div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            <Users className="w-5 h-5" />
            Gerenciar Logins
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {loading ? (
          <p className="text-gray-600">Carregando...</p>
        ) : realtors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-600">
            Nenhum corretor cadastrado ainda.{' '}
            <Link href="/admin/users" className="text-gold-600 hover:underline">
              Criar login de corretor
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {realtors.map((r) => (
              <div key={r.id} className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-navy-950">{r.name}</h3>
                    <p className="text-sm text-gray-500">{r.email}</p>
                    {r.creci && <p className="text-xs text-gray-400 mt-1">CRECI: {r.creci}</p>}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      r.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {r.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <Home className="w-5 h-5 text-navy-500 mx-auto mb-1" />
                    <p className="font-semibold text-navy-950">{r.totalProperties}</p>
                    <p className="text-xs text-gray-500">Imóveis</p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="font-semibold text-navy-950">{r.totalSales}</p>
                    <p className="text-xs text-gray-500">Vendas</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-600 text-sm">
                      R$ {r.totalCommission.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-500">Comissão</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
