'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ExternalLink, Menu, X } from 'lucide-react';
import LogoutButton from '@/components/common/LogoutButton';
import { buildNav, ROLE_LABEL } from '@/components/system/nav-config';

interface SystemShellProps {
  name: string;
  role: string;
  permissions: string[];
  children: React.ReactNode;
}

/** Iniciais para o avatar do topo (ex.: "Guilherme Lima" -> "GL"). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeiro = partes[0][0];
  const ultimo = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeiro + ultimo).toUpperCase();
}

export default function SystemShell({ name, role, permissions, children }: SystemShellProps) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  const grupos = useMemo(() => buildNav(role, permissions), [role, permissions]);

  // O item ativo e o de href mais longo que casa com a rota atual, senao
  // "/admin/rent-charges" ficaria aceso junto com "/admin/rent-charges/overdue".
  const hrefAtivo = useMemo(() => {
    let melhor = '';
    for (const grupo of grupos) {
      for (const item of grupo.items) {
        const casa = pathname === item.href || pathname.startsWith(`${item.href}/`);
        if (casa && item.href.length > melhor.length) melhor = item.href;
      }
    }
    return melhor;
  }, [grupos, pathname]);

  useEffect(() => {
    if (!menuAberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAberto(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuAberto]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fundo escuro da gaveta no celular */}
      {menuAberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
          className="fixed inset-0 z-40 bg-navy-950/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navegação do sistema"
      >
        {/* A logo e a versao clara, entao o topo do menu fica em azul-marinho. */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 bg-navy-950 px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-header.webp"
              alt="SBS Imóveis"
              width={600}
              height={358}
              priority
              className="h-9 w-auto"
            />
          </Link>
          <button
            type="button"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-navy-100 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {grupos.map((grupo, indice) => (
            <div key={grupo.label ?? `topo-${indice}`} className={indice === 0 ? '' : 'mt-6'}>
              {grupo.label && (
                <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {grupo.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {grupo.items.map((item) => {
                  const ativo = item.href === hrefAtivo;
                  const Icone = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuAberto(false)}
                        aria-current={ativo ? 'page' : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                          ativo
                            ? 'bg-navy-50 font-semibold text-navy-900 shadow-[inset_3px_0_0_0_var(--color-gold-500)]'
                            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-navy-900'
                        }`}
                      >
                        <Icone
                          className={`h-[18px] w-[18px] shrink-0 ${
                            ativo ? 'text-gold-600' : 'text-gray-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-gray-100 p-3">
          <div className="mb-2 flex items-center gap-3 px-3 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-950 text-xs font-bold text-gold-300">
              {iniciais(name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-navy-950">{name}</p>
              <p className="truncate text-xs leading-tight text-gray-500">{ROLE_LABEL[role] ?? role}</p>
            </div>
          </div>
          <Link
            href="/"
            onClick={() => setMenuAberto(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-navy-900"
          >
            <ExternalLink className="h-[18px] w-[18px] shrink-0 text-gray-400" />
            Ver o site
          </Link>
          <LogoutButton className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50" />
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* No computador o menu lateral basta; no celular sobra so esta barra
            estreita para abrir a gaveta. */}
        <div className="flex h-14 items-center gap-3 bg-navy-950 px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            className="rounded-lg p-2 text-white hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Image
            src="/logo-header.webp"
            alt="SBS Imóveis"
            width={600}
            height={358}
            priority
            className="h-8 w-auto"
          />
        </div>

        <main>{children}</main>
      </div>
    </div>
  );
}
