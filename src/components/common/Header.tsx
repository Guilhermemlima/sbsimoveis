'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAppSettings } from '@/lib/settings-context';
import { WhatsAppIcon, InstagramIcon, FacebookIcon } from '@/components/common/SocialIcons';

export default function Header() {
  const settings = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-fuchsia-500 to-purple-600 text-white opacity-90 hover:opacity-100 transition-opacity"
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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white opacity-90 hover:opacity-100 transition-opacity"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              <a
                href={`https://wa.me/${settings.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white opacity-90 hover:opacity-100 transition-opacity"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>
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

            <div className="flex items-center gap-2 pt-1">
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-fuchsia-500 to-purple-600 text-white opacity-90 hover:opacity-100 transition-opacity"
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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white opacity-90 hover:opacity-100 transition-opacity"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              <a
                href={`https://wa.me/${settings.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white opacity-90 hover:opacity-100 transition-opacity"
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
