'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { CircleUserRound, Menu, X } from 'lucide-react';
import { useAppSettings } from '@/lib/settings-context';
import { dashboardHrefFor, dashboardLabelFor } from '@/lib/dashboard-nav';
import type { UserRole } from '@/types';
import { WhatsAppIcon, InstagramIcon, FacebookIcon } from '@/components/common/SocialIcons';

export default function Header({ userRole = null }: { userRole?: UserRole | null }) {
  const settings = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Atalho para a area restrita, para nao precisar descer ate o rodape.
  const areaHref = userRole ? dashboardHrefFor(userRole) : '/login';
  const areaLabel = userRole ? dashboardLabelFor(userRole) : 'Área do Corretor';

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinkClass =
    'relative text-navy-100/90 hover:text-white transition-colors after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-gold-400 after:transition-all hover:after:w-full';

  return (
    <header
      className={`sticky top-0 z-50 bg-navy-950 transition-shadow duration-300 ${
        isScrolled ? 'shadow-lg' : ''
      }`}
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3.5">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo-header.webp"
              alt="SBS Imóveis"
              width={600}
              height={358}
              priority
              className="h-10 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex gap-9 items-center" aria-label="Navegação principal">
            <Link href="/" className={navLinkClass}>
              Início
            </Link>
            <Link href="/imoveis" className={navLinkClass}>
              Imóveis
            </Link>
            <Link href="/alugar" className={navLinkClass}>
              Alugar
            </Link>
            <Link href="/sobre" className={navLinkClass}>
              Sobre
            </Link>
            <Link href="/contato" className={navLinkClass}>
              Contato
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex gap-3 items-center">
            <div className="flex items-center gap-2 mr-1">
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-navy-100/70 transition-all hover:text-white hover:bg-gradient-to-br hover:from-amber-400 hover:via-fuchsia-500 hover:to-purple-600"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {settings.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-navy-100/70 transition-all hover:text-white hover:bg-blue-600"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              <a
                href={`https://wa.me/${settings.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-navy-100/70 transition-all hover:text-white hover:bg-green-500"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>

            <span className="h-5 w-px bg-white/15" aria-hidden="true" />

            <Link
              href={areaHref}
              title={areaLabel}
              aria-label={areaLabel}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/40 text-gold-300 transition-all hover:border-gold-400 hover:bg-gold-400 hover:text-navy-950"
            >
              <CircleUserRound className="h-5 w-5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={toggleMenu}
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <nav
          className="md:hidden glass-navy border-t border-white/10 animate-fade-in-up"
          aria-label="Navegação móvel"
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link href="/" className="block text-navy-100 hover:text-white transition">
              Início
            </Link>
            <Link href="/imoveis" className="block text-navy-100 hover:text-white transition">
              Imóveis
            </Link>
            <Link href="/alugar" className="block text-navy-100 hover:text-white transition">
              Alugar
            </Link>
            <Link href="/sobre" className="block text-navy-100 hover:text-white transition">
              Sobre
            </Link>
            <Link href="/contato" className="block text-navy-100 hover:text-white transition">
              Contato
            </Link>

            <Link
              href={areaHref}
              className="flex items-center gap-2 rounded-lg border border-gold-400/40 px-3 py-2 font-semibold text-gold-300 transition hover:bg-gold-400 hover:text-navy-950"
            >
              <CircleUserRound className="h-5 w-5" />
              {areaLabel}
            </Link>

            <div className="flex items-center gap-2 pt-1">
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-navy-100/70 transition-all hover:text-white hover:bg-gradient-to-br hover:from-amber-400 hover:via-fuchsia-500 hover:to-purple-600"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {settings.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-navy-100/70 transition-all hover:text-white hover:bg-blue-600"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              <a
                href={`https://wa.me/${settings.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-navy-100/70 transition-all hover:text-white hover:bg-green-500"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
