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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative w-full h-48 bg-gray-200 overflow-hidden group">
        <Image
          src="/placeholder.jpg"
          alt={property.title}
          fill
          className={`object-cover w-full h-full transition-transform duration-300 group-hover:scale-110 ${
            isImageLoading ? 'blur-sm' : 'blur-0'
          }`}
          onLoad={() => setIsImageLoading(false)}
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {property.is_opportunity && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Badge className="w-3 h-3" />
              Oportunidade
            </span>
          )}
          {property.is_exclusive && (
            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Exclusivo
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => onFavoritToggle?.(property.id)}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition"
          aria-label="Adicionar aos favoritos"
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
        <div className="absolute bottom-4 right-4 bg-blue-900 text-white px-4 py-2 rounded-lg font-bold">
          R$ {property.value.toLocaleString('pt-BR')}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Purpose */}
        <div className="mb-3">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
              {property.title}
            </h3>
            <span className="bg-blue-100 text-blue-900 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
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
        <div className="grid grid-cols-3 gap-2 mb-4 pt-3 border-t">
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Bed className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">{property.bedrooms}</p>
            <p className="text-xs text-gray-500">Quartos</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Bath className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">{property.bathrooms}</p>
            <p className="text-xs text-gray-500">Banheiros</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Maximize2 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {Math.round(property.total_area)}m²
            </p>
            <p className="text-xs text-gray-500">Área</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2">
          <Link
            href={`/imoveis/${property.id}`}
            className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition text-center font-semibold"
          >
            Ver Detalhes
          </Link>
          <a
            href={`https://wa.me/551133334444?text=Tenho interesse no imóvel: ${property.title}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-center font-semibold"
          >
            Interessado
          </a>
        </div>
      </div>
    </div>
  );
}
