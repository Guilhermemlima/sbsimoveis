import { Award, Users, Target, Rocket } from 'lucide-react';

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-blue-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Sobre a SBS Imóveis</h1>
          <p className="text-xl text-blue-100">
            Somos uma plataforma moderna de gestão imobiliária, dedicada a conectar
            corretores, clientes e oportunidades de negócio.
          </p>
        </div>
      </section>

      {/* Missão, Visão, Valores */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <Target className="w-12 h-12 text-blue-900 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Missão</h3>
              <p className="text-gray-600">
                Facilitar e modernizar o processo de compra, venda e aluguel de imóveis
                através de tecnologia segura e transparente.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <Rocket className="w-12 h-12 text-blue-900 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Visão</h3>
              <p className="text-gray-600">
                Ser a plataforma imobiliária mais confiável, inovadora e utilizada do
                Brasil.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <Award className="w-12 h-12 text-blue-900 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Valores</h3>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-10">Nossa História</h2>
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
              Hoje, conectamos centenas de imóveis, dezenas de corretores profissionais e
              milhares de clientes em busca das melhores oportunidades do mercado.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Nossos Números
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-900 mb-2">156+</p>
              <p className="text-gray-600">Imóveis Cadastrados</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-900 mb-2">342+</p>
              <p className="text-gray-600">Clientes Ativos</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-900 mb-2">12+</p>
              <p className="text-gray-600">Corretores Profissionais</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-900 mb-2">48+</p>
              <p className="text-gray-600">Vendas Realizadas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Nossa Equipe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'Antonio Silva',
                role: 'Fundador e CEO',
                bio: 'Mais de 20 anos de experiência no mercado imobiliário',
              },
              {
                name: 'Beatriz Costa',
                role: 'Diretora de Operações',
                bio: 'Especialista em gestão e processos imobiliários',
              },
              {
                name: 'Carlos Mendes',
                role: 'Diretor Comercial',
                bio: 'Líder da equipe de corretores e vendas',
              },
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-24 bg-blue-900 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                <p className="text-sm text-blue-600 font-semibold mb-2">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Quer fazer parte da SBS Imóveis?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Junte-se a nossa equipe de corretores profissionais
          </p>
          <a
            href="https://wa.me/551133334444"
            className="inline-block px-8 py-3 bg-white text-blue-900 font-bold rounded-lg hover:bg-gray-100 transition"
          >
            Converse Conosco
          </a>
        </div>
      </section>
    </div>
  );
}
