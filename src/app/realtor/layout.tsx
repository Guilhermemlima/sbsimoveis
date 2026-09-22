import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import SystemShell from '@/components/system/SystemShell';

export default async function RealtorAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    redirect('/login');
  }

  return (
    <SystemShell name={user.name} role={user.role} permissions={user.permissions}>
      {children}
    </SystemShell>
  );
}
