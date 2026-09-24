import Image from 'next/image';

interface FittedImageProps {
  src: string;
  alt: string;
  /** Tamanhos que o Next usa para escolher a resolucao servida. */
  sizes?: string;
  priority?: boolean;
  /** Classes extras na foto da frente (ex.: zoom no hover do card). */
  className?: string;
}

/**
 * Mostra a foto inteira, sem cortar, em molduras de proporcao fixa.
 *
 * A foto da frente usa object-contain, entao nada e cortado — nem retrato em
 * moldura deitada, nem paisagem em moldura em pe. As sobras laterais ficam
 * preenchidas por uma copia desfocada e ampliada da propria foto, o que evita
 * as tarjas vazias e mantem a vitrine com aparencia uniforme.
 *
 * O fundo pede uma versao minuscula da imagem (sizes="64px"); desfocado,
 * ninguem nota a diferenca e o navegador baixa poucos kB a mais.
 */
export default function FittedImage({
  src,
  alt,
  sizes,
  priority = false,
  className = '',
}: FittedImageProps) {
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        sizes="64px"
        className="object-cover scale-125 blur-2xl"
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-contain ${className}`}
      />
    </>
  );
}
