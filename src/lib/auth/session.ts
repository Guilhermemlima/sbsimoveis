import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, SITE_PASSWORD } from '@/lib/auth/config';

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value === SITE_PASSWORD;
}
