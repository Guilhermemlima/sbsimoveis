'use client';

import { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock, LogIn } from 'lucide-react';
import { loginAction } from '@/lib/auth/actions';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin/dashboard';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SBS Imóveis</h1>
            <p className="text-gray-600">Acesso à área restrita</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha de Acesso
              </label>
              <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 border-2 border-transparent focus-within:border-blue-500">
                <Lock className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-gray-100 w-full outline-none text-gray-900"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-white text-sm">
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
