import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function RealtorAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'realtor' && user.role !== 'admin')) {
    redirect('/login');
  }

  return <>{children}</>;
}
