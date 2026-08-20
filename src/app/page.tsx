'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  MapPin,
  TrendingUp,
  Users,
  Shield,
  Home,
  HandCoins,
  KeyRound,
  Gem,
  Landmark,
  BarChart3,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/common/SocialIcons';
import OpportunitiesCarousel from '@/components/public/OpportunitiesCarousel';
import Reveal from '@/components/common/Reveal';
import { useAppSettings } from '@/lib/settings-context';
import type { Property } from '@/types';

export default function HomePage() {
  const settings = useAppSettings();
  const [opportunities, setOpportunities] = useState<Property[]>([]);
  const [searchCity, setSearchCity] = useState('');
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
      <section className="relative overflow-hidden bg-navy-950 text-white py-24 md:py-36">
        {/* Foto de fundo */}
        <Image
          src="/hero-fundo.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          aria-hidden="true"
        />

        {/* Camadas escuras: sem elas o texto branco some sobre a foto clara.
            Mantidas leves no meio, onde a casa aparece, e mais fechadas no
            topo e na base, onde ficam o titulo e a caixa de busca. */}
        <div className="absolute inset-0 bg-navy-950/45" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/20 to-navy-950/80"
          aria-hidden="true"
        />

        {/* Brilho dourado sutil, mantido por cima da foto */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gold-500/15 blur-3xl animate-float"
          aria-hidden="true"
        />

        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="animate-fade-in-up font-display text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Encontre seu{' '}
              <span className="text-gradient-gold-animated">Imóvel Perfeito</span>
            </h1>
            <p className="animate-fade-in-up text-xl md:text-2xl text-navy-100 mb-10 [animation-delay:100ms]">
              Plataforma confiável para compra, venda e aluguel de imóveis com segurança
              e transparência.
            </p>

            {/* Quick Search */}
            <form
              onSubmit={handleSearch}
              className="animate-fade-in-up bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 md:p-8 text-gray-900 [animation-delay:200ms]"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

              <div className="flex gap-6 flex-wrap justify-center text-sm text-gray-600">
                <Link
                  href="/imoveis?purpose=sale"
                  className="inline-flex items-center gap-1.5 hover:text-gold-600 transition-colors"
                >
                  <Home className="w-4 h-4" strokeWidth={1.5} />
                  Comprar
                </Link>
                <Link
                  href="/alugar"
                  className="inline-flex items-center gap-1.5 hover:text-gold-600 transition-colors"
                >
                  <KeyRound className="w-4 h-4" strokeWidth={1.5} />
                  Alugar
                </Link>
                <Link
                  href="/imoveis?is_opportunity=true"
                  className="inline-flex items-center gap-1.5 hover:text-gold-600 transition-colors"
                >
                  <Gem className="w-4 h-4" strokeWidth={1.5} />
                  Oportunidades
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Opportunities Carousel */}
      <OpportunitiesCarousel properties={opportunities} maxItems={settings.max_opportunities_carousel} />

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
                  'Corretores experientes e credenciados para orientar você em cada etapa.',
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
                icon: Home,
                title: 'Compra de Imóvel',
                description: 'Encontre e compre seu imóvel dos sonhos com segurança.',
                message:
                  'Olá! Vim pelo site da SBS Imóveis e quero comprar um imóvel. Podem me ajudar a encontrar as melhores opções?',
              },
              {
                icon: HandCoins,
                title: 'Venda de Imóvel',
                description: 'Venda seu imóvel rápido e pelo melhor preço.',
                message:
                  'Olá! Vim pelo site da SBS Imóveis e quero vender meu imóvel. Como funciona o processo?',
              },
              {
                icon: KeyRound,
                title: 'Aluguel',
                description: 'Alugue imóveis com condições flexíveis e seguras.',
                message:
                  'Olá! Vim pelo site da SBS Imóveis e tenho interesse em alugar um imóvel. Quais estão disponíveis?',
              },
              {
                icon: Gem,
                title: 'Avaliação',
                description: 'Avaliação profissional do seu imóvel por peritos.',
                message:
                  'Olá! Vim pelo site da SBS Imóveis e gostaria de solicitar uma avaliação do meu imóvel.',
              },
              {
                icon: Landmark,
                title: 'Financiamento',
                description: 'Ajudamos a encontrar as melhores opções de crédito.',
                message:
                  'Olá! Vim pelo site da SBS Imóveis e quero saber mais sobre financiamento imobiliário.',
              },
              {
                icon: BarChart3,
                title: 'Consultoria',
                description: 'Consultoria especializada em investimentos imobiliários.',
                message:
                  'Olá! Vim pelo site da SBS Imóveis e gostaria de uma consultoria sobre investimento em imóveis.',
              },
            ].map((service, index) => (
              <Reveal key={index} delay={(index % 3) * 100}>
                <div className="card-premium bg-white p-8 rounded-xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-gold-300 text-center h-full">
                  <service.icon className="w-10 h-10 mb-4 mx-auto text-gold-600" strokeWidth={1.5} />
                  <h3 className="text-xl font-bold mb-3 text-navy-950">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <a
                    href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(service.message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-gold-600 font-semibold hover:underline"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    Falar no WhatsApp
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
              href={`https://wa.me/${settings.whatsapp_number}`}
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
