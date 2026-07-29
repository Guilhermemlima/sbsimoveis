'use client';

import { useEffect, useRef, useState } from 'react';
import { Share2, Copy, Mail, Check } from 'lucide-react';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '@/components/common/SocialIcons';

interface ShareButtonProps {
  title: string;
  code: string;
  propertyId: string;
}

export default function ShareButton({ title, code, propertyId }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUrl = () => (typeof window !== 'undefined' ? window.location.href : '');
  const getMessage = () => `${title} (código ${code})`;

  const registerShare = () => {
    fetch(`/api/properties/${propertyId}/share`, { method: 'POST' }).catch(() => {});
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      registerShare();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; silently ignore
    }
  };

  const shareOptions = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: <WhatsAppIcon className="w-4 h-4" />,
      onClick: () => {
        registerShare();
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${getMessage()} ${getUrl()}`)}`,
          '_blank',
          'noopener,noreferrer'
        );
      },
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: <FacebookIcon className="w-4 h-4" />,
      onClick: () => {
        registerShare();
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`,
          '_blank',
          'noopener,noreferrer'
        );
      },
    },
    {
      key: 'instagram',
      label: 'Instagram (copiar link)',
      icon: <InstagramIcon className="w-4 h-4" />,
      onClick: () => handleCopyLink(),
    },
    {
      key: 'email',
      label: 'E-mail',
      icon: <Mail className="w-4 h-4" />,
      onClick: () => {
        registerShare();
        window.location.href = `mailto:?subject=${encodeURIComponent(
          `Imóvel: ${title}`
        )}&body=${encodeURIComponent(`${getMessage()}\n\n${getUrl()}`)}`;
      },
    },
    {
      key: 'copy',
      label: copied ? 'Link copiado!' : 'Copiar Link',
      icon: copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />,
      onClick: () => handleCopyLink(),
    },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-navy-950 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Compartilhar
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
          {shareOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                option.onClick();
                if (option.key !== 'copy' && option.key !== 'instagram') setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-navy-950 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition text-left"
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
