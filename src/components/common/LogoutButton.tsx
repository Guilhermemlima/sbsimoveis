'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { logoutAction } from '@/lib/auth/actions';

export default function LogoutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logoutAction())}
      disabled={isPending}
      className={
        className ??
        'w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50'
      }
    >
      <LogOut className="w-4 h-4" />
      {isPending ? 'Saindo...' : 'Sair'}
    </button>
  );
}
