'use client';

import CategorizedActionsMenu, { type ActionCategory } from '@/components/common/CategorizedActionsMenu';

const categories: ActionCategory[] = [
  {
    key: 'imoveis',
    label: 'Imóveis',
    accent: 'border-gold-400',
    items: [
      { href: '/realtor/properties', label: 'Imóveis' },
      { href: '/realtor/documents', label: 'Documentos' },
    ],
  },
  {
    key: 'vendas',
    label: 'Vendas & Clientes',
    accent: 'border-emerald-500',
    items: [
      { href: '/admin/crm', label: 'CRM — Captação' },
      { href: '/admin/leads', label: 'Contatos do Site' },
      { href: '/admin/clients', label: 'Clientes' },
      { href: '/admin/sales', label: 'Vendas' },
      { href: '/admin/reports', label: 'Relatórios' },
    ],
  },
  {
    key: 'locacao',
    label: 'Locação',
    accent: 'border-blue-500',
    items: [
      { href: '/admin/owners', label: 'Proprietários' },
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
      { href: '/admin/legal-cases', label: 'Jurídico' },
    ],
  },
  {
    key: 'equipe',
    label: 'Equipe & Admin',
    accent: 'border-slate-400',
    items: [
      { href: '/admin/realtors', label: 'Corretores' },
      { href: '/admin/users', label: 'Usuários' },
      { href: '/admin/settings', label: 'Configurações' },
      { href: '/admin/audit-log', label: 'Auditoria' },
    ],
  },
];

export default function AdminActionsMenu() {
  return <CategorizedActionsMenu categories={categories} />;
}
