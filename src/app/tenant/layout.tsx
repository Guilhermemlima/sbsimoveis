import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function TenantAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'tenant') {
    redirect('/login');
  }

  return <>{children}</>;
}
