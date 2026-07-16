import { Heart, FileText, MapPin } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/common/LogoutButton';
import { getAppSettings } from '@/lib/settings';
import { getCurrentUser } from '@/lib/auth/session';

export default async function ClientDashboard() {
  const [user, settings] = await Promise.all([getCurrentUser(), getAppSettings()]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Dashboard do Cliente</h1>
          <p className="text-navy-100">Bem-vindo, {user?.name}!</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Stats Cards */}
          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Imóveis Favoritos</p>
                <p className="text-4xl font-bold text-gray-900">0</p>
              </div>
              <Heart className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Propostas</p>
                <p className="text-4xl font-bold text-gray-900">0</p>
              </div>
              <FileText className="w-12 h-12 text-navy-500" />
            </div>
          </div>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Visualizados Recentemente</p>
                <p className="text-4xl font-bold text-gray-900">0</p>
              </div>
              <MapPin className="w-12 h-12 text-green-500" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Proposals */}
            <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Minhas Propostas</h2>
              <p className="text-gray-600">
                Você ainda não tem propostas. Navegue nos imóveis e manifeste interesse!
              </p>
            </div>

            {/* Quick Actions */}
            <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/imoveis"
                  className="px-4 py-3 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition text-center font-semibold"
                >
                  Procurar Imóveis
                </Link>
                <a
                  href={`https://wa.me/${settings.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center font-semibold"
                >
                  Falar com Corretor
                </a>
              </div>
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
                  <p className="text-gray-900 font-medium">{user?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                  <p className="text-gray-900 font-medium">{user?.email}</p>
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
