import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import SystemShell from '@/components/system/SystemShell';

const ALLOWED_ROLES = ['admin', 'realtor', 'finance', 'inspector', 'maintenance_staff', 'legal'];

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    redirect('/login');
  }

  return (
    <SystemShell name={user.name} role={user.role} permissions={user.permissions}>
      {children}
    </SystemShell>
  );
}
