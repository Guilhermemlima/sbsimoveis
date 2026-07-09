import Link from 'next/link';
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-white py-12 relative">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent absolute top-0 left-0" />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="font-display font-semibold text-xl mb-4 text-gradient-gold">
              SBS Imóveis
            </h3>
            <p className="text-navy-100 text-sm mb-4">
              Plataforma profissional para compra, venda e aluguel de imóveis.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-400" />
                <a href="tel:551133334444" className="hover:text-white">
                  (11) 3333-4444
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold-400" />
                <a href="mailto:contato@sbsimoveis.com" className="hover:text-white">
                  contato@sbsimoveis.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-gold-400" />
                <p>São Paulo - SP</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-gold-400">Navegação</h4>
            <ul className="space-y-2 text-sm text-navy-100">
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
            <h4 className="font-semibold mb-4 text-gold-400">Clientes</h4>
            <ul className="space-y-2 text-sm text-navy-100">
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
            <h4 className="font-semibold mb-4 text-gold-400">Corretores</h4>
            <ul className="space-y-2 text-sm text-navy-100">
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
        <div className="border-t border-white/10 pt-8 flex justify-between items-center flex-col md:flex-row gap-4">
          <div className="flex gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-gold-500 hover:text-navy-950 hover:border-gold-500 transition-colors"
              aria-label="Facebook"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-gold-500 hover:text-navy-950 hover:border-gold-500 transition-colors"
              aria-label="Instagram"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-gold-500 hover:text-navy-950 hover:border-gold-500 transition-colors"
              aria-label="LinkedIn"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>

          <div className="text-sm text-navy-100">
            <p>
              © {new Date().getFullYear()} SBS Imóveis. Todos os direitos reservados. |{' '}
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
