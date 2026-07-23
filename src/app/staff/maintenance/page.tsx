'use client';

import Link from 'next/link';
import { Wrench } from 'lucide-react';
import LogoutButton from '@/components/common/LogoutButton';

export default function MaintenanceStaffLandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-gold-400" />
            Manutenção
          </h1>
          <p className="text-navy-100">Área de Manutenção — SBS Imóveis</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-md space-y-4">
        <Link
          href="/admin/maintenance"
          className="block px-6 py-4 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition text-center font-semibold"
        >
          Ver e Gerenciar Solicitações
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
