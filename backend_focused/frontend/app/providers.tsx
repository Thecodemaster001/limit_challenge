'use client';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { PropsWithChildren, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { AuthProvider } from '@/lib/auth/auth-context';

const MAX_QUERY_RETRIES = 2;

function useTheme() {
  return useMemo(
    () =>
      createTheme({
        palette: {
          primary: {
            main: '#0f62fe',
          },
          background: {
            default: '#f5f7fb',
          },
        },
        shape: { borderRadius: 8 },
      }),
    [],
  );
}

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const isClientError = status !== undefined && status >= 400 && status < 500;
  return !isClientError && failureCount < MAX_QUERY_RETRIES;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: shouldRetryQuery },
    },
  });
}

export default function Providers({ children }: PropsWithChildren) {
  const theme = useTheme();
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
