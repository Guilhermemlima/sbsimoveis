import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, Bed, Bath, Maximize2, Car } from 'lucide-react';
import { createServiceRoleClient } from '@/lib/supabase';
import { APP_CONFIG } from '@/lib/constants';

const TYPE_LABEL: Record<string, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  land: 'Terreno',
  commercial: 'Comercial',
  garage: 'Garagem',
  farm: 'Fazenda',
  other: 'Outro',
};

const PURPOSE_LABEL: Record<string, string> = {
  sale: 'Venda',
  rent: 'Aluguel',
  temporary: 'Temporada',
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: property } = await supabase
    .from('properties')
    .select('*, property_images(id, image_url, is_main, order)')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!property) {
    notFound();
  }

  supabase
    .from('properties')
    .update({ views_count: (property.views_count ?? 0) + 1 })
    .eq('id', id)
    .then(() => {});

  const images = [...(property.property_images ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const mainImage =
    images.find((img) => img.is_main)?.image_url ?? images[0]?.image_url ?? '/placeholder.jpg';

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link
          href="/imoveis"
          className="inline-flex items-center gap-2 text-navy-700 hover:text-gold-600 mb-6 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para imóveis
        </Link>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
          <div className="relative w-full h-[420px] bg-gray-200">
            <Image
              src={mainImage}
              alt={property.title}
              fill
              unoptimized={mainImage !== '/placeholder.jpg'}
              className="object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-4">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden">
                  <Image src={img.image_url} alt="" fill unoptimized className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-2 mb-3">
              {property.is_opportunity && (
                <span className="bg-navy-900 text-gold-300 px-3 py-1 rounded-full text-xs font-semibold border border-gold-400/40">
                  Oportunidade
                </span>
              )}
              {property.is_exclusive && (
                <span className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-3 py-1 rounded-full text-xs font-semibold">
                  Exclusivo
                </span>
              )}
              <span className="bg-navy-50 text-navy-900 px-3 py-1 rounded-full text-xs font-semibold">
                {PURPOSE_LABEL[property.purpose]}
              </span>
            </div>

            <h1 className="font-display text-3xl font-bold text-navy-950 mb-2">
              {property.title}
            </h1>
            <p className="text-sm text-gray-500 mb-4">Código: {property.code}</p>
            <div className="flex items-center gap-2 text-gray-600 mb-6">
              <MapPin className="w-5 h-5 text-gold-600" />
              <span>
                {property.neighborhood}, {property.city}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 py-6 border-y border-gray-100 mb-6">
              <div className="text-center">
                <Bed className="w-6 h-6 text-gold-600 mx-auto mb-1" />
                <p className="font-semibold text-navy-950">{property.bedrooms}</p>
                <p className="text-xs text-gray-500">Quartos</p>
              </div>
              <div className="text-center">
                <Bath className="w-6 h-6 text-gold-600 mx-auto mb-1" />
                <p className="font-semibold text-navy-950">{property.bathrooms}</p>
                <p className="text-xs text-gray-500">Banheiros</p>
              </div>
              <div className="text-center">
                <Car className="w-6 h-6 text-gold-600 mx-auto mb-1" />
                <p className="font-semibold text-navy-950">{property.parking_spaces}</p>
                <p className="text-xs text-gray-500">Vagas</p>
              </div>
              <div className="text-center">
                <Maximize2 className="w-6 h-6 text-gold-600 mx-auto mb-1" />
                <p className="font-semibold text-navy-950">{Math.round(property.total_area)}m²</p>
                <p className="text-xs text-gray-500">Área</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-navy-950 mb-3">Descrição</h2>
            <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
              {property.description || 'Sem descrição.'}
            </p>

            {property.amenities?.length > 0 && (
              <>
                <h2 className="text-xl font-bold text-navy-950 mb-3">Comodidades</h2>
                <div className="flex flex-wrap gap-2 mb-6">
                  {property.amenities.map((amenity: string) => (
                    <span
                      key={amenity}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <p className="text-3xl font-bold text-navy-950 mb-1">
                R$ {Number(property.value).toLocaleString('pt-BR')}
                {property.purpose === 'rent' && (
                  <span className="text-base font-normal text-gray-500">/mês</span>
                )}
              </p>
              <p className="text-sm text-gray-500 mb-6">{TYPE_LABEL[property.type]}</p>
              <a
                href={`https://wa.me/${APP_CONFIG.whatsapp}?text=${encodeURIComponent(
                  `Tenho interesse no imóvel: ${property.title} (código ${property.code})`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                💬 Tenho Interesse
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
