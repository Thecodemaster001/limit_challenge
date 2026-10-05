import { PropsWithChildren } from 'react';

import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';

export default function AuthenticatedLayout({ children }: PropsWithChildren) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
