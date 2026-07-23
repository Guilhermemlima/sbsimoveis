import type { RealtorPermission, UserRole } from '@/types';

export function canManageAllProperties(user: { role: UserRole; permissions: string[] }): boolean {
  return user.role === 'admin' || user.permissions.includes('manage_all_properties');
}

export function canManageSales(user: { role: UserRole; permissions: string[] }): boolean {
  return user.role === 'admin' || user.permissions.includes('manage_sales');
}

export function canAccessFinance(user: { role: UserRole } | null): boolean {
  return !!user && (user.role === 'admin' || user.role === 'finance');
}

export function hasFullPropertyAccess(user: { role: UserRole; permissions: string[] }): boolean {
  return canManageAllProperties(user) || user.role === 'finance';
}

export function canAccessInspections(user: { role: UserRole } | null): boolean {
  return !!user && (user.role === 'admin' || user.role === 'inspector');
}

export function canAccessMaintenance(user: { role: UserRole } | null): boolean {
  return !!user && (user.role === 'admin' || user.role === 'maintenance_staff');
}

export const STAFF_ROLES: UserRole[] = ['finance', 'inspector', 'maintenance_staff'];

export const STAFF_ROLE_LABEL: Record<string, string> = {
  finance: 'Financeiro',
  inspector: 'Vistoriador',
  maintenance_staff: 'Responsável pela Manutenção',
};

export type AccessLevel = 'full' | 'limited';

export const FULL_ACCESS_PERMISSIONS: RealtorPermission[] = [
  'manage_own_properties',
  'manage_all_properties',
  'manage_leads',
  'manage_sales',
  'view_reports',
  'manage_team',
  'manage_settings',
];

export const LIMITED_ACCESS_PERMISSIONS: RealtorPermission[] = ['manage_own_properties'];

export function permissionsForAccessLevel(level: AccessLevel): RealtorPermission[] {
  return level === 'full' ? FULL_ACCESS_PERMISSIONS : LIMITED_ACCESS_PERMISSIONS;
}
