'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export interface ActionItem {
  href: string;
  label: string;
}

export interface ActionCategory {
  key: string;
  label: string;
  accent: string;
  items: ActionItem[];
}

export default function CategorizedActionsMenu({ categories }: { categories: ActionCategory[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenKey(null);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenKey(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((category) => {
        const isOpen = openKey === category.key;
        return (
          <div key={category.key} className="relative">
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : category.key)}
              aria-expanded={isOpen}
              className={`w-full h-full min-h-[3.25rem] px-3 py-3 rounded-lg font-bold bg-navy-950 text-white text-center text-sm sm:text-base leading-tight transition flex items-center justify-center gap-1.5 border-2 ${category.accent} hover:bg-navy-900`}
            >
              <span>{category.label}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute left-0 right-0 z-30 mt-1 min-w-[220px] bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                {category.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenKey(null)}
                    className="block px-4 py-3 text-sm font-medium text-navy-950 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
