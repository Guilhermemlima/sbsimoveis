import type { UserRole } from '@/types';

export function dashboardHrefFor(role?: UserRole | null): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'realtor') return '/realtor/dashboard';
  if (role === 'client') return '/client/dashboard';
  if (role === 'tenant') return '/tenant/dashboard';
  if (role === 'finance') return '/staff/finance';
  if (role === 'inspector') return '/staff/inspector';
  if (role === 'maintenance_staff') return '/staff/maintenance';
  if (role === 'legal') return '/staff/legal';
  return '/login';
}

export function dashboardLabelFor(role?: UserRole | null): string {
  if (role === 'client') return 'Minha Conta';
  if (role === 'tenant') return 'Meu Aluguel';
  if (role === 'finance') return 'Financeiro';
  if (role === 'inspector') return 'Vistorias';
  if (role === 'maintenance_staff') return 'Manutenção';
  if (role === 'legal') return 'Jurídico';
  return 'Área do Corretor';
}
