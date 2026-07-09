import Link from 'next/link';
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">SBS Imóveis</h3>
            <p className="text-blue-100 text-sm mb-4">
              Plataforma profissional para compra, venda e aluguel de imóveis.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:551133334444" className="hover:text-white">
                  (11) 3333-4444
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:contato@sbsimoveis.com" className="hover:text-white">
                  contato@sbsimoveis.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <p>São Paulo - SP</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Navegação</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/imoveis" className="hover:text-white transition">
                  Imóveis
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="hover:text-white transition">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-white transition">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="font-bold mb-4">Clientes</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>
                <Link href="/client/dashboard" className="hover:text-white transition">
                  Minha Conta
                </Link>
              </li>
              <li>
                <Link href="/client/favorites" className="hover:text-white transition">
                  Favoritos
                </Link>
              </li>
              <li>
                <Link href="/client/proposals" className="hover:text-white transition">
                  Propostas
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* For Realtors */}
          <div>
            <h4 className="font-bold mb-4">Corretores</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>
                <Link href="/realtor/dashboard" className="hover:text-white transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/realtor/properties" className="hover:text-white transition">
                  Meus Imóveis
                </Link>
              </li>
              <li>
                <Link href="/realtor/leads" className="hover:text-white transition">
                  Leads
                </Link>
              </li>
              <li>
                <Link href="/realtor/sales" className="hover:text-white transition">
                  Vendas
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media */}
        <div className="border-t border-blue-800 pt-8 flex justify-between items-center flex-col md:flex-row gap-4">
          <div className="flex gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-blue-800 rounded-full hover:bg-blue-700 transition"
              aria-label="Facebook"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-blue-800 rounded-full hover:bg-blue-700 transition"
              aria-label="Instagram"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-blue-800 rounded-full hover:bg-blue-700 transition"
              aria-label="LinkedIn"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>

          <div className="text-sm text-blue-100">
            <p>
              © 2024 SBS Imóveis. Todos os direitos reservados. |{' '}
              <Link href="/privacy" className="hover:text-white">
                Política de Privacidade
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
