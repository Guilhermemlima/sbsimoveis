'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/types';
import PropertyCard from './PropertyCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OpportunitiesCarouselProps {
  properties: Property[];
  maxItems?: number;
}

export default function OpportunitiesCarousel({
  properties,
  maxItems = 5,
}: OpportunitiesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [isFavorited, setIsFavorited] = useState<Record<string, boolean>>({});

  // Adjust items per page based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const displayedProperties = properties.slice(0, maxItems);
  const totalSlides = Math.ceil(displayedProperties.length / itemsPerPage);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleFavorite = (propertyId: string) => {
    setIsFavorited((prev) => ({
      ...prev,
      [propertyId]: !prev[propertyId],
    }));
    // TODO: Save to database
  };

  const getVisibleProperties = () => {
    const startIndex = currentIndex * itemsPerPage;
    return displayedProperties.slice(startIndex, startIndex + itemsPerPage);
  };

  if (displayedProperties.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            🎯 Oportunidades em Destaque
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl">
            Confira os melhores imóveis selecionados para você. Excelentes oportunidades
            de negócio com preços competitivos.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {getVisibleProperties().map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isFavorited={isFavorited[property.id] || false}
                onFavoritToggle={handleFavorite}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 md:-translate-x-16 p-3 bg-blue-900 text-white rounded-full shadow-lg hover:bg-blue-800 transition z-10"
                aria-label="Slide anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 md:translate-x-16 p-3 bg-blue-900 text-white rounded-full shadow-lg hover:bg-blue-800 transition z-10"
                aria-label="Próximo slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Slide Indicators */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-blue-900 w-8'
                      : 'bg-gray-300 w-2 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <a
            href="/imoveis"
            className="inline-block px-8 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition"
          >
            Ver Todos os Imóveis →
          </a>
        </div>
      </div>
    </section>
  );
}
