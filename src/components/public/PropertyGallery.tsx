'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Expand } from 'lucide-react';

interface GalleryImage {
  id: string;
  image_url: string;
  is_main?: boolean | null;
  order?: number | null;
}

interface PropertyGalleryProps {
  images: GalleryImage[];
  title: string;
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [atual, setAtual] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const toqueX = useRef<number | null>(null);

  const total = images.length;
  const temVarias = total > 1;

  const anterior = useCallback(() => setAtual((i) => (i - 1 + total) % total), [total]);
  const proxima = useCallback(() => setAtual((i) => (i + 1) % total), [total]);

  // Setas do teclado navegam; Esc fecha a imagem ampliada.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAmpliada(false);
      if (!temVarias) return;
      if (e.key === 'ArrowLeft') anterior();
      if (e.key === 'ArrowRight') proxima();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [anterior, proxima, temVarias]);

  // Trava a rolagem do fundo enquanto a imagem estiver ampliada.
  useEffect(() => {
    if (!ampliada) return;
    const anteriorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anteriorOverflow;
    };
  }, [ampliada]);

  // Arrastar o dedo troca de foto no celular.
  const aoTocarInicio = (e: React.TouchEvent) => {
    toqueX.current = e.touches[0].clientX;
  };
  const aoTocarFim = (e: React.TouchEvent) => {
    if (toqueX.current === null || !temVarias) return;
    const dx = e.changedTouches[0].clientX - toqueX.current;
    if (Math.abs(dx) > 50) (dx > 0 ? anterior : proxima)();
    toqueX.current = null;
  };

  if (total === 0) {
    return (
      <div className="relative w-full h-[420px] bg-gray-200">
        <Image src="/placeholder.jpg" alt={title} fill className="object-cover" />
      </div>
    );
  }

  const url = images[atual].image_url;

  return (
    <>
      <div
        className="relative w-full h-[420px] bg-gray-200 group"
        onTouchStart={aoTocarInicio}
        onTouchEnd={aoTocarFim}
      >
        <button
          type="button"
          onClick={() => setAmpliada(true)}
          className="absolute inset-0 w-full h-full cursor-zoom-in"
          aria-label="Ampliar imagem"
        >
          <Image src={url} alt={title} fill unoptimized className="object-cover" priority />
        </button>

        <span className="pointer-events-none absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white">
          <Expand className="w-3 h-3" />
          Ampliar
        </span>

        {temVarias && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Imagem anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-navy-950 shadow-md transition hover:bg-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={proxima}
              aria-label="Próxima imagem"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-navy-950 shadow-md transition hover:bg-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
              {atual + 1} / {total}
            </span>
          </>
        )}
      </div>

      {temVarias && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-4">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Ver imagem ${i + 1}`}
              aria-current={i === atual}
              className={`relative aspect-square rounded-lg overflow-hidden transition ring-offset-2 ${
                i === atual ? 'ring-2 ring-gold-500' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={img.image_url} alt="" fill unoptimized className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Imagem ampliada */}
      {ampliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setAmpliada(false)}
          onTouchStart={aoTocarInicio}
          onTouchEnd={aoTocarFim}
        >
          <button
            type="button"
            onClick={() => setAmpliada(false)}
            aria-label="Fechar"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          >
            <X className="w-5 h-5" />
          </button>

          {temVarias && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  anterior();
                }}
                aria-label="Imagem anterior"
                className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  proxima();
                }}
                aria-label="Próxima imagem"
                className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <span className="absolute bottom-6 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">
                {atual + 1} / {total}
              </span>
            </>
          )}

          {/* Clique na propria imagem nao fecha, so no fundo */}
          <div
            className="relative h-[85vh] w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image src={url} alt={title} fill unoptimized className="object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
