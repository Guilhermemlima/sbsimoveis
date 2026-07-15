'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sliders } from 'lucide-react';
import PropertyCard from '@/components/public/PropertyCard';
import type { Property } from '@/types';

export default function ImoveisPage() {
  const searchParams = useSearchParams();
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch('/api/properties')
      .then((res) => res.json())
      .then((data: Property[]) => setAllProperties(data));
  }, []);

  // Filter states
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    type: searchParams.get('type') || '',
    purpose: searchParams.get('purpose') || '',
    minPrice: searchParams.get('price_min') || '',
    maxPrice: searchParams.get('price_max') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    sortBy: 'newest',
  });

  // Apply filters
  const filteredProperties = useMemo(() => {
    let result = [...allProperties];

    if (filters.city) {
      result = result.filter((p) =>
        p.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.type) {
      result = result.filter((p) => p.type === filters.type);
    }

    if (filters.purpose) {
      result = result.filter((p) => p.purpose === filters.purpose);
    }

    if (filters.minPrice) {
      result = result.filter((p) => p.value >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      result = result.filter((p) => p.value <= Number(filters.maxPrice));
    }

    if (filters.bedrooms) {
      result = result.filter((p) => p.bedrooms >= Number(filters.bedrooms));
    }

    // Sort
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
      case 'newest':
      default:
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return result;
  }, [filters, allProperties]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-navy-950 mb-2">
            Encontre seu imóvel
          </h1>
          <p className="text-gray-600">
            {filteredProperties.length} imóvel{filteredProperties.length !== 1 ? 'is' : ''} encontrado{filteredProperties.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div
            className={`${
              showFilters ? 'block' : 'hidden'
            } md:block md:w-64 bg-white p-6 rounded-lg shadow-md h-fit`}
          >
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              Filtros
            </h3>

            {/* City Filter */}
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

            {/* Type Filter */}
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
                <option value="land">Terreno</option>
              </select>
            </div>

            {/* Purpose Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Finalidade
              </label>
              <select
                value={filters.purpose}
                onChange={(e) => handleFilterChange('purpose', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors"
              >
                <option value="">Todas</option>
                <option value="sale">Venda</option>
                <option value="rent">Aluguel</option>
                <option value="temporary">Temporada</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preço Mínimo
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="R$"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preço Máximo
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="R$"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            {/* Bedrooms */}
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
              onClick={() => setFilters({
                city: '',
                type: '',
                purpose: '',
                minPrice: '',
                maxPrice: '',
                bedrooms: '',
                sortBy: 'newest',
              })}
              className="w-full px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition"
            >
              Limpar Filtros
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Bar */}
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
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
                <option value="popular">Mais Populares</option>
              </select>
            </div>

            {/* Properties Grid */}
            {filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-lg text-center">
                <p className="text-xl text-gray-600">
                  Nenhum imóvel encontrado com os filtros selecionados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
