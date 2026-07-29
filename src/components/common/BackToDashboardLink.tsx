'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const DASHBOARD_BY_ROLE: Record<string, string> = {
  admin: '/admin/dashboard',
  realtor: '/realtor/dashboard',
  finance: '/staff/finance',
  inspector: '/staff/inspector',
  maintenance_staff: '/staff/maintenance',
  legal: '/staff/legal',
};

export default function BackToDashboardLink({ className }: { className?: string }) {
  const [href, setHref] = useState('/admin/dashboard');

  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (me?.role && DASHBOARD_BY_ROLE[me.role]) setHref(DASHBOARD_BY_ROLE[me.role]);
      });
  }, []);

  return (
    <Link
      href={href}
      className={className ?? 'inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm'}
    >
      <ArrowLeft className="w-4 h-4" />
      Voltar ao Dashboard
    </Link>
  );
}
