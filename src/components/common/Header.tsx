'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { Menu, X, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { logoutAction } from '@/lib/auth/actions';
import { useAppSettings } from '@/lib/settings-context';
import { WhatsAppIcon, InstagramIcon, FacebookIcon } from '@/components/common/SocialIcons';
import type { UserRole } from '@/types';

interface HeaderProps {
  userRole?: UserRole | null;
}

function dashboardHrefFor(role?: UserRole | null): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'realtor') return '/realtor/dashboard';
  if (role === 'client') return '/client/dashboard';
  if (role === 'tenant') return '/tenant/dashboard';
  if (role === 'finance') return '/staff/finance';
  if (role === 'inspector') return '/staff/inspector';
  if (role === 'maintenance_staff') return '/staff/maintenance';
  return '/login';
}

function dashboardLabelFor(role?: UserRole | null): string {
  if (role === 'client') return 'Minha Conta';
  if (role === 'tenant') return 'Meu Aluguel';
  if (role === 'finance') return 'Financeiro';
  if (role === 'inspector') return 'Vistorias';
  if (role === 'maintenance_staff') return 'Manutenção';
  return 'Área do Corretor';
}

export default function Header({ userRole = null }: HeaderProps) {
  const settings = useAppSettings();
  const isAuthenticated = !!userRole;
  const dashboardHref = dashboardHrefFor(userRole);
  const dashboardLabel = dashboardLabelFor(userRole);
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
            <div className="flex items-center gap-2 mr-1">
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-navy-100/80 hover:text-white hover:bg-white/10 transition-colors"
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
                  className="flex h-8 w-8 items-center justify-center rounded-full text-navy-100/80 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              <a
                href={`https://wa.me/${settings.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full text-navy-100/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>

            {isAuthenticated ? (
              <>
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-2 px-4 py-2 text-navy-950 bg-white rounded-lg hover:bg-navy-100 transition-colors font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {dashboardLabel}
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
                Área do Corretor
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

            <div className="flex items-center gap-2 pt-1">
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-navy-100/80 hover:text-white hover:bg-white/10 transition-colors"
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
                  className="flex h-8 w-8 items-center justify-center rounded-full text-navy-100/80 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              <a
                href={`https://wa.me/${settings.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full text-navy-100/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>

            {isAuthenticated ? (
              <div className="flex gap-2 pt-4">
                <Link
                  href={dashboardHref}
                  className="flex-1 text-center px-4 py-2 bg-white text-navy-950 rounded-lg hover:bg-navy-100 font-medium"
                >
                  {dashboardLabel}
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
                Área do Corretor
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
