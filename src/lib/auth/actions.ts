'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { AUTH_COOKIE_NAME } from '@/lib/auth/config';
import { createSessionCookieValue } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';

export interface ActionResult {
  error?: string;
}

const ONE_WEEK = 60 * 60 * 24 * 7;

function defaultRedirectFor(role: string): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'realtor') return '/realtor/dashboard';
  if (role === 'tenant') return '/tenant/dashboard';
  return '/client/dashboard';
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Preencha e-mail e senha.' };
  }

  const supabase = createServiceRoleClient();
  const { data: user } = await supabase
    .from('users')
    .select('id, password_hash, is_active, role')
    .eq('email', email)
    .single();

  if (!user || !user.password_hash || !user.is_active) {
    return { error: 'E-mail ou senha inválidos.' };
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return { error: 'E-mail ou senha inválidos.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, createSessionCookieValue(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_WEEK,
  });

  const redirectTo = String(formData.get('redirectTo') ?? '');
  redirect(redirectTo || defaultRedirectFor(user.role));
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect('/login');
}
