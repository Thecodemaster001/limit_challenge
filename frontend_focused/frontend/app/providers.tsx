'use client';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { PropsWithChildren, useState } from 'react';

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

export default function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
