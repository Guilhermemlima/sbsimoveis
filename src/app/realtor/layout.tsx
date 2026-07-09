import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/session';

export default async function RealtorAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect('/login');
  }

  return <>{children}</>;
}
