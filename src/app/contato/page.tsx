'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Reveal from '@/components/common/Reveal';

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Integrar com backend para enviar email
      console.log('Form submitted:', formData);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setTimeout(() => setSubmitSuccess(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-noise-navy text-white py-16">
        <div className="container mx-auto px-4 animate-fade-in-up">
          <h1 className="font-display text-4xl font-bold mb-4">
            Entre em <span className="text-gradient-gold">Contato</span>
          </h1>
          <p className="text-xl text-navy-100">
            Estamos prontos para ajudar. Fale conosco!
          </p>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Information */}
            <div className="space-y-8">
              <h2 className="font-display text-3xl font-bold text-navy-950 mb-8">
                Informações de Contato
              </h2>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Phone className="w-6 h-6 text-gold-600 mt-1" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Telefone</h3>
                  <a href="tel:551133334444" className="text-gold-600 hover:underline">
                    (11) 3333-4444
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Mail className="w-6 h-6 text-gold-600 mt-1" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <a href="mailto:contato@sbsimoveis.com" className="text-gold-600 hover:underline">
                    contato@sbsimoveis.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <MapPin className="w-6 h-6 text-gold-600 mt-1" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Endereço</h3>
                  <p className="text-gray-600">São Paulo - SP</p>
                </div>
              </div>

              {/* WhatsApp Button */}
              <a
                href="https://wa.me/551133334444"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
              >
                💬 Falar no WhatsApp
              </a>

              {/* Horário de Atendimento */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Horário de Atendimento</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>Segunda a Sexta:</strong> 08:00 - 18:00
                  </p>
                  <p>
                    <strong>Sábado:</strong> 08:00 - 13:00
                  </p>
                  <p>
                    <strong>Domingo:</strong> Disponível via WhatsApp
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 p-8 rounded-lg">
              <h2 className="font-display text-3xl font-bold text-navy-950 mb-8">Envie sua Mensagem</h2>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                  ✅ Mensagem enviada com sucesso! Entraremos em contato em breve.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assunto
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                    required
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="property_inquiry">Dúvida sobre Imóvel</option>
                    <option value="become_realtor">Quero ser Corretor</option>
                    <option value="complaint">Reclamação</option>
                    <option value="suggestion">Sugestão</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Escreva sua mensagem aqui..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500"
                    required
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-navy-900 text-white font-bold rounded-lg hover:bg-navy-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-navy-950 mb-10 text-center">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'Como faço para cadastrar um imóvel?',
                a: 'Para cadastrar um imóvel, você precisa ser um corretor cadastrado na plataforma. Acesse sua área de corretor e clique em "Novo Imóvel".',
              },
              {
                q: 'Qual é a comissão padrão?',
                a: 'A comissão padrão é de 5% sobre o valor da venda. Valores personalizados podem ser negociados.',
              },
              {
                q: 'Como faço para ser um corretor na SBS?',
                a: 'Entre em contato conosco através do WhatsApp ou email com seu CRECI em mãos. Nossa equipe analisará seu perfil.',
              },
              {
                q: 'Quais são os meios de pagamento?',
                a: 'Aceitamos transferência bancária, Pix e cartão de crédito.',
              },
            ].map((faq, index) => (
              <Reveal key={index} delay={index * 80}>
                <div className="card-premium bg-white p-6 rounded-xl border border-gray-200 hover:border-gold-300">
                  <h3 className="font-bold text-navy-950 mb-3">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
