'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, TrendingUp, Users, Shield } from 'lucide-react';
import OpportunitiesCarousel from '@/components/public/OpportunitiesCarousel';
import Reveal from '@/components/common/Reveal';
import { APP_CONFIG } from '@/lib/constants';
import type { Property } from '@/types';

export default function HomePage() {
  const [opportunities, setOpportunities] = useState<Property[]>([]);
  const [searchCity, setSearchCity] = useState('');
  const [searchPrice, setSearchPrice] = useState(0);
  const [searchPurpose, setSearchPurpose] = useState<'sale' | 'rent'>('sale');

  useEffect(() => {
    fetch('/api/properties')
      .then((res) => res.json())
      .then((data: Property[]) => setOpportunities(data.filter((p) => p.is_opportunity)));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirecionar para página de busca com filtros
    const params = new URLSearchParams();
    if (searchCity) params.append('city', searchCity);
    if (searchPrice) params.append('price_max', searchPrice.toString());

    if (searchPurpose === 'rent') {
      window.location.href = `/alugar?${params.toString()}`;
    } else {
      params.append('purpose', 'sale');
      window.location.href = `/imoveis?${params.toString()}`;
    }
  };

  return (
    <>
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-noise-navy text-white py-24 md:py-36">
        {/* Decorative floating glow */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl animate-float"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-navy-500/30 blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
          aria-hidden="true"
        />

        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="animate-fade-in-up inline-block mb-5 px-4 py-1.5 rounded-full border border-gold-400/40 bg-gold-500/10 text-gold-300 text-sm font-medium tracking-wide">
              Corretora de imóveis premium
            </span>
            <h1 className="animate-fade-in-up font-display text-5xl md:text-6xl font-bold mb-6 leading-tight [animation-delay:100ms]">
              Encontre seu{' '}
              <span className="text-gradient-gold-animated">Imóvel Perfeito</span>
            </h1>
            <p className="animate-fade-in-up text-xl md:text-2xl text-navy-100 mb-10 [animation-delay:200ms]">
              Plataforma confiável para compra, venda e aluguel de imóveis com segurança
              e transparência.
            </p>

            {/* Quick Search */}
            <form
              onSubmit={handleSearch}
              className="animate-fade-in-up bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 md:p-8 text-gray-900 [animation-delay:300ms]"
            >
              {/* Finalidade Toggle */}
              <div
                className="inline-flex mb-6 p-1 rounded-lg bg-gray-100"
                role="group"
                aria-label="Finalidade da busca"
              >
                <button
                  type="button"
                  onClick={() => setSearchPurpose('sale')}
                  aria-pressed={searchPurpose === 'sale'}
                  className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${
                    searchPurpose === 'sale'
                      ? 'bg-navy-900 text-white'
                      : 'text-gray-600 hover:text-navy-900'
                  }`}
                >
                  Comprar
                </button>
                <button
                  type="button"
                  onClick={() => setSearchPurpose('rent')}
                  aria-pressed={searchPurpose === 'rent'}
                  className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${
                    searchPurpose === 'rent'
                      ? 'bg-navy-900 text-white'
                      : 'text-gray-600 hover:text-navy-900'
                  }`}
                >
                  Alugar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative text-left">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cidade
                  </label>
                  <div className="flex items-center bg-gray-100 rounded-lg px-3 py-3 border border-transparent focus-within:border-gold-500 transition-colors">
                    <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                      type="text"
                      placeholder="Ex: Guarapuava"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="bg-gray-100 w-full outline-none text-gray-900"
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Imóvel
                  </label>
                  <select className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-3 text-gray-900 focus:border-gold-500 outline-none transition-colors">
                    <option value="">Qualquer tipo</option>
                    <option value="house">Casa</option>
                    <option value="apartment">Apartamento</option>
                    <option value="commercial">Comercial</option>
                    <option value="land">Terreno</option>
                  </select>
                </div>

                <div className="text-left">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {searchPurpose === 'rent' ? 'Aluguel Máximo' : 'Preço Máximo'}
                  </label>
                  <input
                    type="number"
                    placeholder={searchPurpose === 'rent' ? 'R$ 5.000' : 'R$ 1.000.000'}
                    value={searchPrice || ''}
                    onChange={(e) => setSearchPrice(Number(e.target.value))}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-3 text-gray-900 focus:border-gold-500 outline-none transition-colors"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-navy-900 text-white font-bold py-3 rounded-lg hover:bg-navy-800 transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    Buscar
                  </button>
                </div>
              </div>

              <div className="flex gap-4 flex-wrap justify-center text-sm text-gray-600">
                <Link href="/imoveis?purpose=sale" className="hover:text-gold-600 transition-colors">
                  🏠 Comprar
                </Link>
                <Link href="/alugar" className="hover:text-gold-600 transition-colors">
                  📋 Alugar
                </Link>
                <Link href="/imoveis?is_opportunity=true" className="hover:text-gold-600 transition-colors">
                  ⚡ Oportunidades
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Opportunities Carousel */}
      <OpportunitiesCarousel properties={opportunities} maxItems={5} />

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <Reveal>
            <h2 className="font-display text-4xl font-bold text-center mb-12 text-navy-950">
              Por que escolher a <span className="text-gradient-gold">SBS Imóveis?</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8 text-navy-900" />,
                title: 'Segurança Garantida',
                description:
                  'Todas as transações são seguras e verificadas. Proteção total dos seus dados.',
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-navy-900" />,
                title: 'Melhores Preços',
                description:
                  'Encontre os melhores imóveis pelo melhor preço do mercado.',
              },
              {
                icon: <Users className="w-8 h-8 text-navy-900" />,
                title: 'Equipe Profissional',
                description:
                  'Corretores experientes prontos para ajudar você 24/7.',
              },
            ].map((item, index) => (
              <Reveal key={index} delay={index * 120}>
                <div className="card-premium text-center p-8 bg-gray-50 rounded-xl border border-transparent hover:border-gold-300 h-full">
                  <div className="flex justify-center mb-5">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold-100 to-gold-50">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-navy-950">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <Reveal>
            <h2 className="font-display text-4xl font-bold text-center mb-12 text-navy-950">
              Nossos Serviços
            </h2>
          </Reveal>

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
              <Reveal key={index} delay={(index % 3) * 100}>
                <div className="card-premium bg-white p-8 rounded-xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-gold-300 text-center h-full">
                  <div className="text-5xl mb-4">{service.emoji}</div>
                  <h3 className="text-xl font-bold mb-3 text-navy-950">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <a href="#contact" className="text-gold-600 font-semibold hover:underline">
                    Saber mais →
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-noise-navy text-white py-20">
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-64 w-[36rem] rounded-full bg-gold-500/15 blur-3xl"
          aria-hidden="true"
        />
        <Reveal className="container relative mx-auto px-4 text-center" as="section">
          <h2 className="font-display text-4xl font-bold mb-6">Pronto para começar?</h2>
          <p className="text-xl mb-8 text-navy-100">
            Fale agora com um de nossos consultores e conheça as melhores oportunidades.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/imoveis"
              className="px-8 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors shadow-[var(--shadow-gold)]"
            >
              Ver Imóveis
            </Link>
            <a
              href={`https://wa.me/${APP_CONFIG.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
            >
              Fale com Consultor
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
