import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

const ALLOWED_ROLES = ['admin', 'realtor', 'finance', 'inspector', 'maintenance_staff'];

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    redirect('/login');
  }

  return <>{children}</>;
}
