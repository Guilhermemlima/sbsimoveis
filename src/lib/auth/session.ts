import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth/config';
import { signSessionToken, verifySessionToken } from '@/lib/auth/token';
import { createServiceRoleClient } from '@/lib/supabase';
import type { UserRole } from '@/types';

export function createSessionCookieValue(userId: string): string {
  return signSessionToken(userId);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const userId = verifySessionToken(token);
  if (!userId) return null;

  const supabase = createServiceRoleClient();
  const { data: user } = await supabase
    .from('users')
    .select('id, email, name, role, is_active')
    .eq('id', userId)
    .single();

  if (!user || !user.is_active) return null;

  let permissions: string[] = [];
  if (user.role === 'realtor') {
    const { data: perms } = await supabase
      .from('realtor_permissions')
      .select('permission')
      .eq('realtor_id', user.id);
    permissions = (perms ?? []).map((p: { permission: string }) => p.permission);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions,
  };
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}
