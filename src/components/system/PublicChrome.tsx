'use client';

import { usePathname } from 'next/navigation';

/** Rotas com menu lateral proprio, onde o cabecalho/rodape do site nao aparece. */
const ROTAS_DO_SISTEMA = ['/admin', '/realtor'];

export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noSistema = ROTAS_DO_SISTEMA.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );
  if (noSistema) return null;
  return <>{children}</>;
}
