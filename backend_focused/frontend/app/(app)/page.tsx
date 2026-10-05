'use client';

import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/lib/auth/auth-context';

export default function DashboardPage() {
  const { username } = useAuth();

  return (
    <PageHeader title="Dashboard" description={`Welcome back${username ? `, ${username}` : ''}.`} />
  );
}
