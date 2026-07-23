'use client';

import Link from 'next/link';
import { DollarSign } from 'lucide-react';
import LogoutButton from '@/components/common/LogoutButton';

export default function FinanceLandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-gold-400" />
            Financeiro
          </h1>
          <p className="text-navy-100">Área Financeira — SBS Imóveis</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-md space-y-4">
        <Link
          href="/admin/rent-charges"
          className="block px-6 py-4 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition text-center font-semibold"
        >
          Cobranças de Locação
        </Link>
        <Link
          href="/admin/payouts"
          className="block px-6 py-4 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition text-center font-semibold"
        >
          Repasses a Proprietários
        </Link>
        <Link
          href="/admin/expenses"
          className="block px-6 py-4 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition text-center font-semibold"
        >
          Despesas
        </Link>
        <Link
          href="/admin/reports"
          className="block px-6 py-4 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition text-center font-semibold"
        >
          Relatórios
        </Link>
        <Link
          href="/admin/schedule"
          className="block px-6 py-4 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition text-center font-semibold"
        >
          Cronograma Financeiro
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
