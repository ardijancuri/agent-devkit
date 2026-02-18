'use client';

import { usePathname } from 'next/navigation';
import { Shell } from './Shell';

const PUBLIC_ROUTES = ['/login'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return <Shell>{children}</Shell>;
}
