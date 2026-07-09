'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { Menu, X, Phone, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { logoutAction } from '@/lib/auth/actions';

interface HeaderProps {
  isAuthenticated?: boolean;
}

export default function Header({ isAuthenticated = false }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPending, startTransition] = useTransition();

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
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-navy shadow-lg' : 'bg-navy-950'
      }`}
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 text-navy-950 font-display font-bold text-lg shadow-[0_0_0_1px_rgba(198,163,85,0.3)] transition-transform group-hover:scale-105">
              S
            </span>
            <span className="font-display text-xl font-semibold tracking-wide text-white">
              SBS <span className="text-gradient-gold">Imóveis</span>
            </span>
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
            <a
              href="https://wa.me/551133334444"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              WhatsApp
            </a>

            {isAuthenticated ? (
              <>
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-navy-950 bg-white rounded-lg hover:bg-navy-100 transition-colors font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Área Restrita
                </Link>
                <button
                  onClick={() => startTransition(() => logoutAction())}
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-navy-950 rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  {isPending ? 'Saindo...' : 'Sair'}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-navy-950 rounded-lg hover:bg-gold-400 transition-colors font-medium shadow-[var(--shadow-gold)]"
              >
                <LogIn className="w-4 h-4" />
                Área Restrita
              </Link>
            )}
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

            {isAuthenticated ? (
              <div className="flex gap-2 pt-4">
                <Link
                  href="/admin/dashboard"
                  className="flex-1 text-center px-4 py-2 bg-white text-navy-950 rounded-lg hover:bg-navy-100 font-medium"
                >
                  Área Restrita
                </Link>
                <button
                  onClick={() => startTransition(() => logoutAction())}
                  disabled={isPending}
                  className="flex-1 text-center px-4 py-2 bg-gold-500 text-navy-950 rounded-lg hover:bg-gold-400 disabled:opacity-50 font-medium"
                >
                  {isPending ? 'Saindo...' : 'Sair'}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block text-center px-4 py-2 bg-gold-500 text-navy-950 rounded-lg hover:bg-gold-400 font-medium"
              >
                Área Restrita
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
