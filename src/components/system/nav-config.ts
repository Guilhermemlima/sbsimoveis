import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Contact,
  FileSignature,
  FilePlus2,
  FolderOpen,
  History,
  Home,
  Images,
  KanbanSquare,
  LayoutDashboard,
  type LucideIcon,
  Receipt,
  Scale,
  Send,
  Settings,
  ShieldCheck,
  SquarePlus,
  Store,
  UserCheck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** Titulo da secao no menu lateral; null = itens soltos no topo. */
  label: string | null;
  items: NavItem[];
}

/**
 * Monta o menu lateral respeitando as mesmas regras de visibilidade que o antigo
 * menu de quadrados usava: corretor enxerga conforme as permissoes dele, os
 * demais papeis internos enxergam tudo.
 */
export function buildNav(role: string, permissions: string[]): NavGroup[] {
  const isRealtor = role === 'realtor';
  const full = !isRealtor || permissions.includes('manage_all_properties');
  const can = (permission: string) => !isRealtor || permissions.includes(permission);

  const comercial: NavItem[] = [
    { href: '/admin/leads', label: 'Contatos do Site', icon: Contact },
  ];
  if (full) comercial.push({ href: '/admin/clients', label: 'Clientes', icon: Users });
  if (can('manage_sales')) comercial.push({ href: '/admin/sales', label: 'Vendas', icon: Store });

  const locacao: NavItem[] = full
    ? [
        { href: '/admin/leases', label: 'Contratos de Locação', icon: FileSignature },
        { href: '/admin/owners', label: 'Proprietários', icon: Building2 },
        { href: '/admin/tenants', label: 'Inquilinos', icon: UserCheck },
        { href: '/admin/guarantors', label: 'Fiadores', icon: ShieldCheck },
        { href: '/admin/amendments', label: 'Aditivos', icon: FilePlus2 },
      ]
    : [];

  const financeiro: NavItem[] = [];
  if (full) {
    financeiro.push(
      { href: '/admin/rent-charges', label: 'Cobranças de Locação', icon: Receipt },
      { href: '/admin/rent-charges/overdue', label: 'Parcelas Vencidas', icon: AlertTriangle },
      { href: '/admin/payouts', label: 'Repasses a Proprietários', icon: Send },
      { href: '/admin/expenses', label: 'Despesas', icon: Wallet },
      { href: '/admin/schedule', label: 'Cronograma Financeiro', icon: CalendarDays }
    );
  }
  if (can('view_reports')) financeiro.push({ href: '/admin/reports', label: 'Relatórios', icon: BarChart3 });

  const operacoes: NavItem[] = full
    ? [
        { href: '/admin/operacional', label: 'Painel Operacional', icon: Activity },
        { href: '/admin/inspections', label: 'Vistorias', icon: ClipboardCheck },
        { href: '/admin/maintenance', label: 'Manutenção', icon: Wrench },
        { href: '/admin/legal-cases', label: 'Jurídico', icon: Scale },
      ]
    : [];

  const equipe: NavItem[] = [];
  if (full) equipe.push({ href: '/admin/realtors', label: 'Corretores', icon: Users });
  if (!isRealtor) equipe.push({ href: '/admin/users', label: 'Usuários', icon: UserCheck });

  const plataforma: NavItem[] = [];
  if (!isRealtor) {
    plataforma.push(
      { href: '/admin/carousel', label: 'Carrossel do Site', icon: Images },
      { href: '/admin/settings', label: 'Configurações', icon: Settings }
    );
  }
  if (full) plataforma.push({ href: '/admin/audit-log', label: 'Auditoria', icon: History });

  const groups: NavGroup[] = [
    {
      label: null,
      items: [
        // O CRM e a tela principal de quem opera o sistema.
        { href: '/admin/crm', label: 'CRM — Captação', icon: KanbanSquare },
        {
          href: isRealtor ? '/realtor/dashboard' : '/admin/dashboard',
          label: 'Indicadores',
          icon: LayoutDashboard,
        },
      ],
    },
    { label: 'Comercial', items: comercial },
    {
      label: 'Imóveis',
      items: [
        { href: '/realtor/properties', label: 'Imóveis', icon: Home },
        { href: '/realtor/properties/new', label: 'Novo Imóvel', icon: SquarePlus },
        { href: '/realtor/documents', label: 'Documentos', icon: FolderOpen },
      ],
    },
    { label: 'Locação', items: locacao },
    { label: 'Financeiro', items: financeiro },
    { label: 'Operações', items: operacoes },
    { label: 'Equipe', items: equipe },
    { label: 'Plataforma', items: plataforma },
  ];

  return groups.filter((group) => group.items.length > 0);
}

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  realtor: 'Corretor',
  finance: 'Financeiro',
  inspector: 'Vistoriador',
  maintenance_staff: 'Manutenção',
  legal: 'Jurídico',
};
