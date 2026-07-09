'use client';

import { Heart, FileText, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/common/LogoutButton';

export default function ClientDashboard() {
  // Mock client data
  const clientData = {
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    favoriteCount: 5,
    proposalCount: 2,
    recentlyViewed: 3,
  };

  const mockProposals = [
    {
      id: '1',
      propertyTitle: 'Apartamento Pinheiros',
      status: 'sent',
      value: 850000,
      date: '2024-01-15',
    },
    {
      id: '2',
      propertyTitle: 'Casa Alphaville',
      status: 'accepted',
      value: 1200000,
      date: '2024-01-10',
    },
  ];

  const statusLabel = {
    sent: 'Enviada',
    accepted: 'Aceita',
    rejected: 'Rejeitada',
    pending: 'Pendente',
  };

  const statusColor = {
    sent: 'bg-navy-100 text-navy-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Dashboard do Cliente</h1>
          <p className="text-navy-100">Bem-vindo, {clientData.name}!</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          {/* Stats Cards */}
          <Link
            href="/client/favorites"
            className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Imóveis Favoritos</p>
                <p className="text-4xl font-bold text-gray-900">{clientData.favoriteCount}</p>
              </div>
              <Heart className="w-12 h-12 text-red-500" />
            </div>
          </Link>

          <Link
            href="/client/proposals"
            className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Propostas</p>
                <p className="text-4xl font-bold text-gray-900">{clientData.proposalCount}</p>
              </div>
              <FileText className="w-12 h-12 text-navy-500" />
            </div>
          </Link>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Visualizados Recentemente</p>
                <p className="text-4xl font-bold text-gray-900">{clientData.recentlyViewed}</p>
              </div>
              <MapPin className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Contatos Recebidos</p>
                <p className="text-4xl font-bold text-gray-900">3</p>
              </div>
              <Phone className="w-12 h-12 text-orange-500" />
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

              {mockProposals.length > 0 ? (
                <div className="space-y-4">
                  {mockProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-navy-500 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {proposal.propertyTitle}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Enviada em{' '}
                            {new Date(proposal.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            statusColor[
                              proposal.status as keyof typeof statusColor
                            ]
                          }`}
                        >
                          {statusLabel[proposal.status as keyof typeof statusLabel]}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 mb-3">
                        R$ {proposal.value.toLocaleString('pt-BR')}
                      </div>
                      <button className="px-4 py-2 bg-navy-100 text-navy-900 rounded hover:bg-navy-100 transition text-sm font-semibold">
                        Ver Detalhes
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">
                  Você ainda não tem propostas. Navegue nos imóveis e manifeste interesse!
                </p>
              )}
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
                <Link
                  href="/client/favorites"
                  className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-center font-semibold"
                >
                  Meus Favoritos
                </Link>
                <Link
                  href="/client/profile"
                  className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-center font-semibold"
                >
                  Meu Perfil
                </Link>
                <a
                  href="https://wa.me/551133334444"
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
                  <p className="text-gray-900 font-medium">{clientData.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                  <p className="text-gray-900 font-medium">{clientData.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Telefone</p>
                  <p className="text-gray-900 font-medium">{clientData.phone}</p>
                </div>
              </div>
              <Link
                href="/client/profile"
                className="mt-4 w-full py-2 bg-navy-100 text-navy-900 rounded-lg hover:bg-navy-100 transition text-center font-semibold text-sm"
              >
                Editar Perfil
              </Link>
            </div>

            {/* Account Settings */}
            <div className="card-premium bg-white p-6 rounded-xl shadow border border-transparent hover:border-gold-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Conta</h3>
              <div className="space-y-2">
                <Link
                  href="/client/preferences"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded transition"
                >
                  Minhas Preferências
                </Link>
                <Link
                  href="/client/security"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded transition"
                >
                  Segurança
                </Link>
                <Link
                  href="/client/notifications"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded transition"
                >
                  Notificações
                </Link>
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
