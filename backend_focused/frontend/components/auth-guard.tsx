'use client';

import { useRouter } from 'next/navigation';
import { PropsWithChildren, useEffect } from 'react';

import { FullPageSpinner } from '@/components/full-page-spinner';
import { useAuth } from '@/lib/auth/auth-context';
import { tokenStorage } from '@/lib/auth/token-storage';

/** Renders its children only for signed-in users; sends everyone else to the login page. */
export function AuthGuard({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'anonymous') return;
    const loginParams = new URLSearchParams({
      next: window.location.pathname + window.location.search,
    });
    const reason = tokenStorage.takeSignOutReason();
    if (reason) loginParams.set('reason', reason);
    router.replace(`/login?${loginParams}`);
  }, [status, router]);

  if (status !== 'authenticated') return <FullPageSpinner label="Checking your session" />;
  return children;
}
