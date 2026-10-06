import { cookies } from 'next/headers';

import AppShell from '@/components/app-shell';
import { SIDEBAR_COLLAPSED_COOKIE } from '@/lib/sidebar-preference';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isSidebarCollapsed = cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === 'true';

  return <AppShell initialSidebarCollapsed={isSidebarCollapsed}>{children}</AppShell>;
}
