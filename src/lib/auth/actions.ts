'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME, SITE_PASSWORD } from '@/lib/auth/config';

export interface ActionResult {
  error?: string;
}

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get('password') ?? '');

  if (!password) {
    return { error: 'Digite a senha de acesso.' };
  }

  if (password !== SITE_PASSWORD) {
    return { error: 'Senha incorreta.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, SITE_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_WEEK,
  });

  const redirectTo = String(formData.get('redirectTo') ?? '/admin/dashboard');
  redirect(redirectTo || '/admin/dashboard');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect('/login');
}
