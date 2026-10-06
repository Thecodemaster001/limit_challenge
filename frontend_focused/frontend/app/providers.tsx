'use client';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { PropsWithChildren, useEffect, useState } from 'react';

import { NotificationProvider } from '@/components/notifications';
import { onSessionExpired } from '@/lib/api-client';
import { theme } from '@/lib/theme';

const MAX_QUERY_RETRIES = 2;

function shouldRetryQuery(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const isClientError = status !== undefined && status >= 400 && status < 500;
  return !isClientError && failureCount < MAX_QUERY_RETRIES;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetryQuery },
    },
  });
}

function SessionExpiredRedirect() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    onSessionExpired(() => {
      queryClient.clear();
      const currentPath = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
    });
  }, [queryClient, router]);

  return null;
}

export default function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionExpiredRedirect />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>{children}</NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
