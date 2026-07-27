'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface QuickActionItem {
  href: string;
  label: string;
}

interface QuickActionCategory {
  key: string;
  label: string;
  accent: string;
  items: QuickActionItem[];
}

function buildCategories(permissions: string[]): QuickActionCategory[] {
  const hasFullAccess = permissions.includes('manage_all_properties');
  const categories: QuickActionCategory[] = [
    {
      key: 'imoveis',
      label: 'Imóveis',
      accent: 'border-gold-500',
      items: [
        { href: '/realtor/properties/new', label: '+ Novo Imóvel' },
        { href: '/realtor/properties', label: 'Meus Imóveis' },
        { href: '/realtor/documents', label: 'Documentos' },
      ],
    },
  ];

  const vendasItems: QuickActionItem[] = [];
  if (permissions.includes('manage_sales')) vendasItems.push({ href: '/admin/sales', label: 'Vendas' });
  if (permissions.includes('view_reports')) vendasItems.push({ href: '/admin/reports', label: 'Relatórios' });
  if (hasFullAccess) vendasItems.push({ href: '/admin/clients', label: 'Clientes' });
  if (vendasItems.length > 0) {
    categories.push({
      key: 'vendas',
      label: 'Vendas & Clientes',
      accent: 'border-emerald-700',
      items: vendasItems,
    });
  }

  if (hasFullAccess) {
    categories.push(
      {
        key: 'locacao',
        label: 'Locação',
        accent: 'border-blue-700',
        items: [
          { href: '/admin/leases', label: 'Contratos de Locação' },
          { href: '/admin/owners', label: 'Proprietários' },
          { href: '/admin/tenants', label: 'Inquilinos' },
        ],
      },
      {
        key: 'financeiro',
        label: 'Financeiro',
        accent: 'border-navy-950',
        items: [
          { href: '/admin/rent-charges', label: 'Cobranças de Locação' },
          { href: '/admin/payouts', label: 'Repasses a Proprietários' },
          { href: '/admin/expenses', label: 'Despesas' },
          { href: '/admin/schedule', label: 'Cronograma Financeiro' },
        ],
      },
      {
        key: 'operacoes',
        label: 'Operações',
        accent: 'border-orange-700',
        items: [
          { href: '/admin/inspections', label: 'Vistorias' },
          { href: '/admin/maintenance', label: 'Manutenção' },
          { href: '/admin/amendments', label: 'Aditivos' },
        ],
      },
      {
        key: 'equipe',
        label: 'Equipe & Admin',
        accent: 'border-slate-600',
        items: [
          { href: '/admin/realtors', label: 'Corretores' },
          { href: '/admin/audit-log', label: 'Auditoria' },
        ],
      }
    );
  }

  return categories;
}

export default function QuickActionsMenu({ permissions }: { permissions: string[] }) {
  const categories = buildCategories(permissions);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenKey(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((category) => {
        const isOpen = openKey === category.key;
        return (
          <div
            key={category.key}
            className="relative"
            onMouseEnter={() => setOpenKey(category.key)}
            onMouseLeave={() => setOpenKey((prev) => (prev === category.key ? null : prev))}
          >
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : category.key)}
              aria-expanded={isOpen}
              className={`w-full h-full min-h-[3.25rem] px-3 py-3 rounded-lg font-bold bg-white text-navy-950 text-center text-sm sm:text-base leading-tight transition flex items-center justify-center gap-1.5 border-2 ${category.accent} hover:bg-gray-50`}
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
