'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/auth') || pathname.startsWith('/register') || pathname.startsWith('/admin')) {
      setAuthorized(true);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setAuthorized(false);
      router.push('/auth');
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (!authorized && !pathname.startsWith('/auth') && !pathname.startsWith('/register') && !pathname.startsWith('/admin')) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading authentication...</div>;
  }

  return <>{children}</>;
}
