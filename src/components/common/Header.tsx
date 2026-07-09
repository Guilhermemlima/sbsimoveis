'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Menu, X, Home, Phone, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { logoutAction } from '@/lib/auth/actions';

interface HeaderProps {
  isAuthenticated?: boolean;
}

export default function Header({ isAuthenticated = false }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-blue-900">
          <Home className="w-6 h-6" />
          <span>SBS Imóveis</span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-8 items-center">
          <Link href="/" className="text-gray-700 hover:text-blue-900 transition">
            Início
          </Link>
          <Link href="/imoveis" className="text-gray-700 hover:text-blue-900 transition">
            Imóveis
          </Link>
          <Link href="/sobre" className="text-gray-700 hover:text-blue-900 transition">
            Sobre
          </Link>
          <Link href="/contato" className="text-gray-700 hover:text-blue-900 transition">
            Contato
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex gap-4 items-center">
          <a
            href="https://wa.me/551133334444"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            <Phone className="w-4 h-4" />
            WhatsApp
          </a>

          {isAuthenticated ? (
            <>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-blue-900 border-2 border-blue-900 rounded-lg hover:bg-blue-50 transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                Área Restrita
              </Link>
              <button
                onClick={() => startTransition(() => logoutAction())}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {isPending ? 'Saindo...' : 'Sair'}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
            >
              <LogIn className="w-4 h-4" />
              Área Restrita
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <nav className="md:hidden bg-gray-50 border-t">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link
              href="/"
              className="block text-gray-700 hover:text-blue-900 transition"
            >
              Início
            </Link>
            <Link
              href="/imoveis"
              className="block text-gray-700 hover:text-blue-900 transition"
            >
              Imóveis
            </Link>
            <Link
              href="/sobre"
              className="block text-gray-700 hover:text-blue-900 transition"
            >
              Sobre
            </Link>
            <Link
              href="/contato"
              className="block text-gray-700 hover:text-blue-900 transition"
            >
              Contato
            </Link>

            {isAuthenticated ? (
              <div className="flex gap-2 pt-4">
                <Link
                  href="/admin/dashboard"
                  className="flex-1 text-center px-4 py-2 text-blue-900 border-2 border-blue-900 rounded-lg hover:bg-blue-50"
                >
                  Área Restrita
                </Link>
                <button
                  onClick={() => startTransition(() => logoutAction())}
                  disabled={isPending}
                  className="flex-1 text-center px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {isPending ? 'Saindo...' : 'Sair'}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block text-center px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
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
