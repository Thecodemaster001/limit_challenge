'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

import { onSessionExpired } from '@/lib/api-client';
import { obtainTokenPair } from '@/lib/api/auth';
import type { Credentials } from '@/lib/api/types';
import { tokenStorage } from '@/lib/auth/token-storage';

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  username: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Tokens only exist in the browser; during server rendering the status is "checking".
const getServerRefreshToken = () => undefined;
const getServerUsername = () => null;

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const refreshToken = useSyncExternalStore(
    tokenStorage.subscribe,
    tokenStorage.getRefreshToken,
    getServerRefreshToken,
  );
  const username = useSyncExternalStore(
    tokenStorage.subscribe,
    tokenStorage.getUsername,
    getServerUsername,
  );

  let status: AuthStatus = 'anonymous';
  if (refreshToken === undefined) status = 'checking';
  else if (refreshToken) status = 'authenticated';

  useEffect(() => {
    onSessionExpired(() => queryClient.clear());
  }, [queryClient]);

  const login = useCallback(
    async (credentials: Credentials) => {
      const tokens = await obtainTokenPair(credentials);
      queryClient.clear();
      tokenStorage.saveSession({ ...tokens, username: credentials.username });
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ status, username, login, logout }),
    [status, username, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
