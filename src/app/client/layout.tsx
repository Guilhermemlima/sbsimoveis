import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/session';

export default async function ClientAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect('/login');
  }

  return <>{children}</>;
}
