import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function ClientAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'client') {
    redirect('/login');
  }

  return <>{children}</>;
}
