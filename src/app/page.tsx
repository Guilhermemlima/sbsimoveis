'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Home, TrendingUp, Users, Shield, Award } from 'lucide-react';
import OpportunitiesCarousel from '@/components/public/OpportunitiesCarousel';

// Mock data - será substituído por dados reais do banco
const mockProperties = [
  {
    id: '1',
    realtor_id: 'realtor1',
    title: 'Apartamento Moderno em Pinheiros',
    code: 'APT-001',
    type: 'apartment' as const,
    purpose: 'sale' as const,
    value: 850000,
    address: 'Rua Exemplo, 123',
    city: 'São Paulo',
    neighborhood: 'Pinheiros',
    latitude: -23.56,
    longitude: -46.67,
    total_area: 120,
    built_area: 100,
    bedrooms: 3,
    bathrooms: 2,
    parking_spaces: 1,
    description: 'Apartamento com acabamento de luxo, vista para a cidade',
    amenities: ['Piscina', 'Academia', 'Churrasqueira'],
    status: 'available' as const,
    is_opportunity: true,
    is_featured: true,
    is_exclusive: false,
    views_count: 245,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    realtor_id: 'realtor1',
    title: 'Casa com Terreno em Alphaville',
    code: 'CASA-002',
    type: 'house' as const,
    purpose: 'sale' as const,
    value: 1200000,
    address: 'Rua das Flores, 456',
    city: 'São Paulo',
    neighborhood: 'Alphaville',
    latitude: -23.61,
    longitude: -46.85,
    total_area: 500,
    built_area: 300,
    bedrooms: 4,
    bathrooms: 3,
    parking_spaces: 3,
    description: 'Casa espaçosa com piscina e área verde',
    amenities: ['Piscina', 'Churrasqueira', 'Quadra de Tênis'],
    status: 'available' as const,
    is_opportunity: true,
    is_featured: true,
    is_exclusive: true,
    views_count: 412,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    realtor_id: 'realtor2',
    title: 'Comercial Loja Centro',
    code: 'COM-003',
    type: 'commercial' as const,
    purpose: 'rent' as const,
    value: 8000,
    address: 'Av. Paulista, 789',
    city: 'São Paulo',
    neighborhood: 'Centro',
    latitude: -23.56,
    longitude: -46.66,
    total_area: 80,
    built_area: 80,
    bedrooms: 0,
    bathrooms: 1,
    parking_spaces: 2,
    description: 'Loja comercial em localização privilegiada',
    amenities: ['Ar Condicionado', 'Segurança 24h'],
    status: 'available' as const,
    is_opportunity: true,
    is_featured: false,
    is_exclusive: false,
    views_count: 156,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function HomePage() {
  const [searchCity, setSearchCity] = useState('');
  const [searchPrice, setSearchPrice] = useState(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirecionar para página de busca com filtros
    const params = new URLSearchParams();
    if (searchCity) params.append('city', searchCity);
    if (searchPrice) params.append('price_max', searchPrice.toString());
    window.location.href = `/imoveis?${params.toString()}`;
  };

  return (
    <>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Encontre seu <span className="text-yellow-400">Imóvel Perfeito</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10">
              Plataforma confiável para compra, venda e aluguel de imóveis com segurança
              e transparência.
            </p>

            {/* Quick Search */}
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-lg shadow-xl p-6 md:p-8 text-gray-900"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cidade
                  </label>
                  <div className="flex items-center bg-gray-100 rounded-lg px-3 py-3">
                    <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                      type="text"
                      placeholder="Ex: São Paulo"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="bg-gray-100 w-full outline-none text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Imóvel
                  </label>
                  <select className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-3 text-gray-900">
                    <option value="">Qualquer tipo</option>
                    <option value="house">Casa</option>
                    <option value="apartment">Apartamento</option>
                    <option value="commercial">Comercial</option>
                    <option value="land">Terreno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preço Máximo
                  </label>
                  <input
                    type="number"
                    placeholder="R$ 1.000.000"
                    value={searchPrice || ''}
                    onChange={(e) => setSearchPrice(Number(e.target.value))}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-blue-900 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    Buscar
                  </button>
                </div>
              </div>

              <div className="flex gap-4 flex-wrap justify-center text-sm text-gray-600">
                <Link href="/imoveis?purpose=sale" className="hover:text-blue-900">
                  🏠 Comprar
                </Link>
                <Link href="/imoveis?purpose=rent" className="hover:text-blue-900">
                  📋 Alugar
                </Link>
                <Link href="/imoveis?is_opportunity=true" className="hover:text-blue-900">
                  ⚡ Oportunidades
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Opportunities Carousel */}
      <OpportunitiesCarousel properties={mockProperties} maxItems={5} />

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Por que escolher a <span className="text-blue-900">SBS Imóveis?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-12 h-12 text-blue-900" />,
                title: 'Segurança Garantida',
                description:
                  'Todas as transações são seguras e verificadas. Proteção total dos seus dados.',
              },
              {
                icon: <TrendingUp className="w-12 h-12 text-blue-900" />,
                title: 'Melhores Preços',
                description:
                  'Encontre os melhores imóveis pelo melhor preço do mercado.',
              },
              {
                icon: <Users className="w-12 h-12 text-blue-900" />,
                title: 'Equipe Profissional',
                description:
                  'Corretores experientes prontos para ajudar você 24/7.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="text-center p-8 bg-gray-50 rounded-lg hover:shadow-lg transition"
              >
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Nossos Serviços
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                emoji: '🏠',
                title: 'Compra de Imóvel',
                description: 'Encontre e compre seu imóvel dos sonhos com segurança.',
              },
              {
                emoji: '💰',
                title: 'Venda de Imóvel',
                description: 'Venda seu imóvel rápido e pelo melhor preço.',
              },
              {
                emoji: '🔑',
                title: 'Aluguel',
                description: 'Alugue imóveis com condições flexíveis e seguras.',
              },
              {
                emoji: '💎',
                title: 'Avaliação',
                description: 'Avaliação profissional do seu imóvel por peritos.',
              },
              {
                emoji: '🏦',
                title: 'Financiamento',
                description: 'Ajudamos a encontrar as melhores opções de crédito.',
              },
              {
                emoji: '📊',
                title: 'Consultoria',
                description: 'Consultoria especializada em investimentos imobiliários.',
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition text-center"
              >
                <div className="text-5xl mb-4">{service.emoji}</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <a href="#contact" className="text-blue-900 font-semibold hover:underline">
                  Saber mais →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            O que nossos clientes dizem
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'João Silva',
                role: 'Comprador',
                text: 'Excelente atendimento! Encontrei o imóvel perfeito com a ajuda da equipe SBS.',
                stars: 5,
              },
              {
                name: 'Maria Santos',
                role: 'Vendedora',
                text: 'Processo rápido e transparente. Recomendo para todos que querem vender!',
                stars: 5,
              },
              {
                name: 'Pedro Oliveira',
                role: 'Investidor',
                text: 'Plataforma confiável com ótimas oportunidades de investimento.',
                stars: 5,
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-lg">
                <div className="flex gap-1 mb-4">
                  {Array(testimonial.stars)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i} className="text-yellow-400 text-xl">
                        ★
                      </span>
                    ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para começar?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Fale agora com um de nossos consultores e conheça as melhores oportunidades.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://wa.me/551133334444"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition"
            >
              Fale com Consultor
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
