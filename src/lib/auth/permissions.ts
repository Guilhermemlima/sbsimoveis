import type { RealtorPermission, UserRole } from '@/types';

export function canManageAllProperties(user: { role: UserRole; permissions: string[] }): boolean {
  return user.role === 'admin' || user.permissions.includes('manage_all_properties');
}

export function canManageSales(user: { role: UserRole; permissions: string[] }): boolean {
  return user.role === 'admin' || user.permissions.includes('manage_sales');
}

function isFullAccessRealtor(user: { role: UserRole; permissions?: string[] }): boolean {
  return user.role === 'realtor' && !!user.permissions?.includes('manage_all_properties');
}

export function canAccessFinance(user: { role: UserRole; permissions?: string[] } | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'finance' || isFullAccessRealtor(user);
}

export function hasFullPropertyAccess(user: { role: UserRole; permissions: string[] }): boolean {
  return canManageAllProperties(user) || user.role === 'finance';
}

export function canAccessInspections(user: { role: UserRole; permissions?: string[] } | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'inspector' || isFullAccessRealtor(user);
}

export function canAccessMaintenance(user: { role: UserRole; permissions?: string[] } | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'maintenance_staff' || isFullAccessRealtor(user);
}

export function canAccessAmendments(user: { role: UserRole; permissions?: string[] } | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || isFullAccessRealtor(user);
}

export function canAccessBackOffice(user: { role: UserRole; permissions?: string[] } | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || isFullAccessRealtor(user);
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
