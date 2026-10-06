import type { Metadata } from 'next';

import LoginForm from '@/components/login-form';
import { safeRedirectPath } from '@/lib/safe-redirect-path';

export const metadata: Metadata = { title: 'Sign in' };

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const requestedPath = Array.isArray(next) ? next[0] : next;
  return <LoginForm redirectTo={safeRedirectPath(requestedPath)} />;
}
