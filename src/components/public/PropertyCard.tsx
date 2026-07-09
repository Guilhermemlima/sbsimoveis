'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Property } from '@/types';
import { Heart, MapPin, Bed, Bath, Maximize2, Badge } from 'lucide-react';
import { useState } from 'react';

interface PropertyCardProps {
  property: Property;
  isFavorited?: boolean;
  onFavoritToggle?: (propertyId: string) => void;
}

export default function PropertyCard({
  property,
  isFavorited = false,
  onFavoritToggle,
}: PropertyCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);

  const propertyTypeLabel: Record<string, string> = {
    house: 'Casa',
    apartment: 'Apartamento',
    land: 'Terreno',
    commercial: 'Comercial',
    garage: 'Garagem',
    farm: 'Fazenda',
    other: 'Outro',
  };

  const purposeLabel: Record<string, string> = {
    sale: 'Venda',
    rent: 'Aluguel',
    temporary: 'Temporada',
  };

  return (
    <div className="card-premium bg-white rounded-xl shadow-md overflow-hidden border border-transparent hover:border-gold-300">
      {/* Image Container */}
      <div className="relative w-full h-48 bg-gray-200 overflow-hidden group">
        <Image
          src="/placeholder.jpg"
          alt={property.title}
          fill
          className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 ${
            isImageLoading ? 'blur-sm' : 'blur-0'
          }`}
          onLoad={() => setIsImageLoading(false)}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {property.is_opportunity && (
            <span className="bg-navy-900 text-gold-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-gold-400/40">
              <Badge className="w-3 h-3" />
              Oportunidade
            </span>
          )}
          {property.is_exclusive && (
            <span className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-3 py-1 rounded-full text-xs font-semibold">
              Exclusivo
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => onFavoritToggle?.(property.id)}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
          aria-label={
            isFavorited
              ? `Remover ${property.title} dos favoritos`
              : `Adicionar ${property.title} aos favoritos`
          }
          aria-pressed={isFavorited}
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorited
                ? 'fill-red-500 text-red-500'
                : 'text-gray-400 hover:text-red-500'
            }`}
          />
        </button>

        {/* Price Badge */}
        <div className="absolute bottom-4 right-4 bg-gradient-to-r from-gold-400 to-gold-500 text-navy-950 px-4 py-2 rounded-lg font-bold shadow-[var(--shadow-gold)]">
          R$ {property.value.toLocaleString('pt-BR')}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Purpose */}
        <div className="mb-3">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-bold text-lg text-navy-950 line-clamp-2">
              {property.title}
            </h3>
            <span className="bg-navy-50 text-navy-900 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
              {purposeLabel[property.purpose]}
            </span>
          </div>
          <span className="text-xs text-gray-500">Código: {property.code}</span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-1 mb-3 text-sm text-gray-600">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{property.neighborhood}</p>
            <p className="text-xs">{property.city}</p>
          </div>
        </div>

        {/* Type */}
        <p className="text-sm text-gray-700 mb-3 font-medium">
          {propertyTypeLabel[property.type]}
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 mb-4 pt-3 border-t border-gray-100">
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Bed className="w-5 h-5 text-gold-600" />
            </div>
            <p className="text-sm font-semibold text-navy-950">{property.bedrooms}</p>
            <p className="text-xs text-gray-500">Quartos</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Bath className="w-5 h-5 text-gold-600" />
            </div>
            <p className="text-sm font-semibold text-navy-950">{property.bathrooms}</p>
            <p className="text-xs text-gray-500">Banheiros</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Maximize2 className="w-5 h-5 text-gold-600" />
            </div>
            <p className="text-sm font-semibold text-navy-950">
              {Math.round(property.total_area)}m²
            </p>
            <p className="text-xs text-gray-500">Área</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2">
          <Link
            href={`/imoveis/${property.id}`}
            className="flex-1 px-4 py-2 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors text-center font-semibold"
          >
            Ver Detalhes
          </Link>
          <a
            href={`https://wa.me/551133334444?text=${encodeURIComponent(
              `Tenho interesse no imóvel: ${property.title}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-center font-semibold"
          >
            Interessado
          </a>
        </div>
      </div>
    </div>
  );
}
