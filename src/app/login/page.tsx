'use client';

import { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, LogIn } from 'lucide-react';
import { loginAction } from '@/lib/auth/actions';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.set('email', email);
    formData.set('password', password);
    formData.set('redirectTo', redirectTo);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
      // On success, loginAction redirects server-side.
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-noise-navy flex items-center justify-center py-10 px-4">
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl animate-float"
        aria-hidden="true"
      />
      <div className="w-full max-w-md animate-scale-in relative">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 text-navy-950 font-display font-bold text-xl shadow-[var(--shadow-gold)]">
              S
            </span>
            <h1 className="font-display text-3xl font-bold text-navy-950 mb-2">
              SBS Imóveis
            </h1>
            <p className="text-gray-600">Acesso à área restrita</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                E-mail
              </label>
              <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 border-2 border-transparent focus-within:border-gold-500 transition-colors mb-6">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@sbsimoveis.com.br"
                  className="bg-gray-100 w-full outline-none text-gray-900"
                  autoFocus
                  required
                />
              </div>

              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Senha
              </label>
              <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 border-2 border-transparent focus-within:border-gold-500 transition-colors">
                <Lock className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-gray-100 w-full outline-none text-gray-900"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-navy-900 text-white font-bold rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-navy-100 text-sm">
          <p>Acesso restrito a administradores e corretores.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
