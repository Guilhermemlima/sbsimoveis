'use client';

import CategorizedActionsMenu, { type ActionCategory, type ActionItem } from '@/components/common/CategorizedActionsMenu';

function buildCategories(permissions: string[]): ActionCategory[] {
  const hasFullAccess = permissions.includes('manage_all_properties');
  const categories: ActionCategory[] = [
    {
      key: 'imoveis',
      label: 'Imóveis',
      accent: 'border-gold-400',
      items: [
        { href: '/realtor/properties/new', label: '+ Novo Imóvel' },
        { href: '/realtor/properties', label: 'Meus Imóveis' },
        { href: '/realtor/documents', label: 'Documentos' },
      ],
    },
  ];

  const vendasItems: ActionItem[] = [
    { href: '/admin/crm', label: 'CRM — Captação' },
    { href: '/admin/leads', label: 'Contatos do Site' },
  ];
  if (permissions.includes('manage_sales')) vendasItems.push({ href: '/admin/sales', label: 'Vendas' });
  if (permissions.includes('view_reports')) vendasItems.push({ href: '/admin/reports', label: 'Relatórios' });
  if (hasFullAccess) vendasItems.push({ href: '/admin/clients', label: 'Clientes' });
  if (vendasItems.length > 0) {
    categories.push({
      key: 'vendas',
      label: 'Vendas & Clientes',
      accent: 'border-emerald-500',
      items: vendasItems,
    });
  }

  if (hasFullAccess) {
    categories.push(
      {
        key: 'locacao',
        label: 'Locação',
        accent: 'border-blue-500',
        items: [
          { href: '/admin/leases', label: 'Contratos de Locação' },
          { href: '/admin/owners', label: 'Proprietários' },
          { href: '/admin/tenants', label: 'Inquilinos' },
          { href: '/admin/guarantors', label: 'Fiadores' },
        ],
      },
      {
        key: 'financeiro',
        label: 'Financeiro',
        accent: 'border-gray-400',
        items: [
          { href: '/admin/rent-charges', label: 'Cobranças de Locação' },
          { href: '/admin/rent-charges/overdue', label: 'Parcelas Vencidas' },
          { href: '/admin/payouts', label: 'Repasses a Proprietários' },
          { href: '/admin/expenses', label: 'Despesas' },
          { href: '/admin/schedule', label: 'Cronograma Financeiro' },
        ],
      },
      {
        key: 'operacoes',
        label: 'Operações',
        accent: 'border-orange-500',
        items: [
          { href: '/admin/inspections', label: 'Vistorias' },
          { href: '/admin/maintenance', label: 'Manutenção' },
          { href: '/admin/amendments', label: 'Aditivos' },
          { href: '/admin/legal-cases', label: 'Jurídico' },
        ],
      },
      {
        key: 'equipe',
        label: 'Equipe & Admin',
        accent: 'border-slate-400',
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
  return <CategorizedActionsMenu categories={buildCategories(permissions)} />;
}
