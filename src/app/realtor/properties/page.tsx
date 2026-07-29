'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Key, Plus, Pencil, Trash2, Eye, MessageCircle, Share2 } from 'lucide-react';
import type { Property, PropertyImage, PropertyPurpose } from '@/types';

type PropertyWithImages = Property & { property_images?: PropertyImage[] };

const PURPOSE_LABEL: Record<PropertyPurpose, string> = {
  sale: 'Venda',
  rent: 'Aluguel',
  temporary: 'Temporada',
};

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponível',
  reserved: 'Reservado',
  sold: 'Vendido',
  rented: 'Alugado',
  archived: 'Arquivado',
};

const STATUS_COLOR: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-navy-100 text-navy-900',
  rented: 'bg-gold-100 text-gold-700',
  archived: 'bg-gray-100 text-gray-700',
};

type Tab = 'all' | 'sale' | 'rent';

function coverImage(property: PropertyWithImages): string | null {
  const images = property.property_images ?? [];
  return images.find((img) => img.is_main)?.image_url ?? images[0]?.image_url ?? null;
}

export default function MyPropertiesPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('purpose') === 'rent' ? 'rent' : 'all';

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [properties, setProperties] = useState<PropertyWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProperties = () => {
    fetch('/api/realtor/properties')
      .then((res) => res.json())
      .then((data) => setProperties(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este imóvel do site? Ele deixará de aparecer nas buscas.')) return;
    setProperties((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/realtor/properties/${id}`, { method: 'DELETE' });
  };

  const filtered = useMemo(() => {
    if (activeTab === 'all') return properties;
    return properties.filter((p) => p.purpose === activeTab);
  }, [properties, activeTab]);

  const counts = useMemo(
    () => ({
      all: properties.length,
      sale: properties.filter((p) => p.purpose === 'sale').length,
      rent: properties.filter((p) => p.purpose === 'rent').length,
    }),
    [properties]
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: `Todos (${counts.all})`, icon: <Home className="w-4 h-4" /> },
    { key: 'sale', label: `Venda (${counts.sale})`, icon: <Home className="w-4 h-4" /> },
    { key: 'rent', label: `Aluguel (${counts.rent})`, icon: <Key className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Meus Imóveis</h1>
            <p className="text-navy-100">
              Gerencie seus imóveis para venda e aluguel
            </p>
          </div>
          <Link
            href="/realtor/properties/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 text-navy-950 rounded-lg font-semibold hover:bg-gold-400 transition-colors shadow-[var(--shadow-gold)]"
          >
            <Plus className="w-4 h-4" />
            Novo Imóvel
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Tabs */}
        <div className="inline-flex mb-8 p-1 rounded-lg bg-white shadow border border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-navy-900 text-white'
                  : 'text-gray-600 hover:text-navy-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Imóvel</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Finalidade</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Valor</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estatísticas</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {coverImage(property) ? (
                            <Image
                              src={coverImage(property) as string}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Home className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-navy-950">{property.title}</p>
                          <p className="text-xs text-gray-500">
                            Código: {property.code} · {property.neighborhood}, {property.city}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          property.purpose === 'rent'
                            ? 'bg-gold-100 text-gold-700'
                            : 'bg-navy-100 text-navy-900'
                        }`}
                      >
                        {PURPOSE_LABEL[property.purpose]}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-navy-950">
                      R$ {property.value.toLocaleString('pt-BR')}
                      {property.purpose === 'rent' && (
                        <span className="text-xs text-gray-500 font-normal">/mês</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[property.status]}`}
                      >
                        {STATUS_LABEL[property.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1" title="Visualizações">
                          <Eye className="w-3.5 h-3.5 text-navy-500" />
                          {property.views_count ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Contatos">
                          <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                          {property.contacts_count ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Compartilhamentos">
                          <Share2 className="w-3.5 h-3.5 text-gold-600" />
                          {property.shares_count ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/realtor/properties/${property.id}/edit`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900 hover:text-gold-600 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length === 0 && (
            <div className="p-12 text-center text-gray-600">
              Nenhum imóvel encontrado nesta categoria.
            </div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>
      </div>
    </div>
  );
}
