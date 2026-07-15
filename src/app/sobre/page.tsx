import { Award, Target, Rocket } from 'lucide-react';
import Reveal from '@/components/common/Reveal';
import { APP_CONFIG } from '@/lib/constants';

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-noise-navy text-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl animate-fade-in-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Sobre a <span className="text-gradient-gold">SBS Imóveis</span>
          </h1>
          <p className="text-xl text-navy-100">
            Somos uma plataforma moderna de gestão imobiliária, dedicada a conectar
            corretores, clientes e oportunidades de negócio.
          </p>
        </div>
      </section>

      {/* Missão, Visão, Valores */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="card-premium bg-white p-8 rounded-xl shadow-md text-center border border-transparent hover:border-gold-300">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold-100 to-gold-50 mx-auto mb-4">
                <Target className="w-8 h-8 text-navy-900" />
              </div>
              <h3 className="text-2xl font-bold text-navy-950 mb-3">Missão</h3>
              <p className="text-gray-600">
                Facilitar e modernizar o processo de compra, venda e aluguel de imóveis
                através de tecnologia segura e transparente.
              </p>
            </div>

            <div className="card-premium bg-white p-8 rounded-xl shadow-md text-center border border-transparent hover:border-gold-300">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold-100 to-gold-50 mx-auto mb-4">
                <Rocket className="w-8 h-8 text-navy-900" />
              </div>
              <h3 className="text-2xl font-bold text-navy-950 mb-3">Visão</h3>
              <p className="text-gray-600">
                Ser a plataforma imobiliária mais confiável, inovadora e utilizada do
                Brasil.
              </p>
            </div>

            <div className="card-premium bg-white p-8 rounded-xl shadow-md text-center border border-transparent hover:border-gold-300">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold-100 to-gold-50 mx-auto mb-4">
                <Award className="w-8 h-8 text-navy-900" />
              </div>
              <h3 className="text-2xl font-bold text-navy-950 mb-3">Valores</h3>
              <p className="text-gray-600">
                Transparência, segurança, inovação e foco no cliente são nossos pilares.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-navy-950 mb-10">Nossa História</h2>
          <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
            <p>
              A SBS Imóveis foi fundada com a visão de revolucionar o mercado imobiliário
              brasileiro através da tecnologia. O que começou como um pequeno projeto tem
              se tornado uma referência em gestão de imóveis.
            </p>
            <p>
              Nossa plataforma foi desenvolvida ouvindo as necessidades reais de corretores
              e clientes, resultando em um sistema intuitivo, seguro e poderoso.
            </p>
            <p>
              Estamos construindo essa jornada agora, com foco em Guarapuava e região,
              conectando corretores profissionais a clientes em busca das melhores
              oportunidades do mercado.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-noise-navy text-white">
        <Reveal className="container mx-auto px-4 text-center" as="section">
          <h2 className="font-display text-3xl font-bold mb-6">
            Quer fazer parte da SBS Imóveis?
          </h2>
          <p className="text-lg text-navy-100 mb-8">
            Junte-se a nossa equipe de corretores profissionais
          </p>
          <a
            href={`https://wa.me/${APP_CONFIG.whatsapp}`}
            className="inline-block px-8 py-3 bg-gold-500 text-navy-950 font-bold rounded-lg hover:bg-gold-400 transition-colors shadow-[var(--shadow-gold)]"
          >
            Converse Conosco
          </a>
        </Reveal>
      </section>
    </div>
  );
}
