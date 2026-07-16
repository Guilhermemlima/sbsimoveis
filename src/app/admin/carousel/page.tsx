'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { Property } from '@/types';

export default function AdminCarouselPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxCarousel, setMaxCarousel] = useState(5);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/realtor/properties')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMaxCarousel(data.max_opportunities_carousel);
      });
  }, []);

  const opportunityCount = properties.filter((p) => p.is_opportunity).length;

  const toggleFlag = async (property: Property, flag: 'is_opportunity' | 'is_featured' | 'is_exclusive') => {
    const newValue = !property[flag];
    setSavingId(property.id);
    setProperties((prev) =>
      prev.map((p) => (p.id === property.id ? { ...p, [flag]: newValue } : p))
    );
    await fetch(`/api/realtor/properties/${property.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [flag]: newValue }),
    });
    setSavingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-gold-400" />
            Carrossel de Oportunidades
          </h1>
          <p className="text-navy-100">
            Escolha quais imóveis aparecem em destaque na página inicial
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <strong className="text-navy-950">{opportunityCount}</strong> imóvel(is) marcado(s) como
            Oportunidade — o carrossel exibe no máximo{' '}
            <strong className="text-navy-950">{maxCarousel}</strong> por vez (ajustável em{' '}
            <Link href="/admin/settings" className="text-gold-600 hover:underline">
              Configurações
            </Link>
            ).
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Imóvel</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">
                    Oportunidade
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">
                    Destaque na Home
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">
                    Exclusivo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy-950">{property.title}</p>
                      <p className="text-xs text-gray-500">
                        Código: {property.code} · {property.neighborhood}, {property.city}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={property.is_opportunity}
                        disabled={savingId === property.id}
                        onChange={() => toggleFlag(property, 'is_opportunity')}
                        className="w-5 h-5 accent-gold-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={property.is_featured}
                        disabled={savingId === property.id}
                        onChange={() => toggleFlag(property, 'is_featured')}
                        className="w-5 h-5 accent-gold-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={property.is_exclusive}
                        disabled={savingId === property.id}
                        onChange={() => toggleFlag(property, 'is_exclusive')}
                        className="w-5 h-5 accent-gold-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && properties.length === 0 && (
            <div className="p-12 text-center text-gray-600">
              Nenhum imóvel cadastrado ainda. Cadastre imóveis em{' '}
              <Link href="/realtor/properties/new" className="text-gold-600 hover:underline">
                Novo Imóvel
              </Link>
              .
            </div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>
      </div>
    </div>
  );
}
