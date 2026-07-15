import type { Metadata } from 'next';
import { Geist_Mono, Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { getCurrentUser } from '@/lib/auth/session';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SBS Imóveis - Plataforma de Compra, Venda e Aluguel',
  description:
    'Plataforma completa para gerenciamento e negociação de imóveis. Encontre seu próximo imóvel ou venda seu imóvel com segurança.',
  keywords: [
    'imóveis',
    'compra',
    'venda',
    'aluguel',
    'corretor',
    'casa',
    'apartamento',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://sbsimoveis.com',
    title: 'SBS Imóveis',
    description: 'Plataforma profissional de imóveis',
    images: [
      {
        url: 'https://sbsimoveis.com/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <body
        className={`${jakarta.variable} ${playfair.variable} ${geistMono.variable} antialiased bg-white`}
      >
        <a href="#conteudo-principal" className="skip-link">
          Pular para o conteúdo principal
        </a>
        <Header userRole={user?.role ?? null} />
        <main id="conteudo-principal" className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
