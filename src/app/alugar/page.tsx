'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Key, Sliders } from 'lucide-react';
import PropertyCard from '@/components/public/PropertyCard';
import Reveal from '@/components/common/Reveal';
import type { Property } from '@/types';

export default function AlugarPage() {
  const searchParams = useSearchParams();
  const [rentalProperties, setRentalProperties] = useState<Property[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch('/api/properties')
      .then((res) => res.json())
      .then((data: Property[]) =>
        setRentalProperties(data.filter((p) => p.purpose === 'rent'))
      );
  }, []);

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    type: '',
    bedrooms: '',
    maxPrice: searchParams.get('price_max') || '',
    sortBy: 'newest',
  });

  const filteredProperties = useMemo(() => {
    let result = [...rentalProperties];

    if (filters.city) {
      result = result.filter((p) =>
        p.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    if (filters.type) {
      result = result.filter((p) => p.type === filters.type);
    }
    if (filters.bedrooms) {
      result = result.filter((p) => p.bedrooms >= Number(filters.bedrooms));
    }
    if (filters.maxPrice) {
      result = result.filter((p) => p.value <= Number(filters.maxPrice));
    }

    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.value - b.value);
        break;
      case 'price_desc':
        result.sort((a, b) => b.value - a.value);
        break;
      case 'popular':
        result.sort((a, b) => b.views_count - a.views_count);
        break;
      default:
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return result;
  }, [filters, rentalProperties]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-noise-navy text-white py-16 md:py-20">
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl animate-float"
          aria-hidden="true"
        />
        <div className="container relative mx-auto px-4 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-gold-400/40 bg-gold-500/10 text-gold-300 text-sm font-medium">
            <Key className="w-4 h-4" />
            Aluguel
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Encontre seu próximo <span className="text-gradient-gold">lar para alugar</span>
          </h1>
          <p className="text-xl text-navy-100 max-w-2xl">
            Imóveis para locação com contratos seguros e corretores prontos para
            agendar sua visita.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <Reveal className="mb-8">
          <p className="text-gray-600">
            {filteredProperties.length} imóvel
            {filteredProperties.length !== 1 ? 'is' : ''} disponív
            {filteredProperties.length !== 1 ? 'eis' : 'el'} para aluguel
          </p>
        </Reveal>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div
            className={`${
              showFilters ? 'block' : 'hidden'
            } md:block md:w-64 bg-white p-6 rounded-xl shadow-md h-fit`}
          >
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-navy-950">
              <Sliders className="w-5 h-5 text-gold-500" />
              Filtros
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Digite a cidade"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Imóvel
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors"
              >
                <option value="">Todos</option>
                <option value="house">Casa</option>
                <option value="apartment">Apartamento</option>
                <option value="commercial">Comercial</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Aluguel Máximo (mensal)
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="R$"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mínimo de Quartos
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors"
              >
                <option value="">Qualquer</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>

            <button
              onClick={() =>
                setFilters({
                  city: '',
                  type: '',
                  bedrooms: '',
                  maxPrice: '',
                  sortBy: 'newest',
                })
              }
              className="w-full px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden px-4 py-2 bg-navy-900 text-white rounded-lg"
              >
                {showFilters ? 'Fechar Filtros' : 'Mostrar Filtros'}
              </button>

              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors"
              >
                <option value="newest">Mais Recentes</option>
                <option value="price_asc">Menor Aluguel</option>
                <option value="price_desc">Maior Aluguel</option>
                <option value="popular">Mais Populares</option>
              </select>
            </div>

            {filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-xl text-center">
                <p className="text-xl text-gray-600">
                  Nenhum imóvel para aluguel encontrado com os filtros selecionados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
