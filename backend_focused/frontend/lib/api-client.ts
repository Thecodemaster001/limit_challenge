import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import type { TokenRefresh } from '@/lib/api/types';
import { tokenStorage } from '@/lib/auth/token-storage';
import { createSingleFlight } from '@/lib/single-flight';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';
const AUTH_PATH_PREFIX = '/auth/';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
});

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retriedAfterRefresh?: boolean };

let handleSessionExpired: () => void = () => {};

/** Registers what happens when the session can no longer be refreshed (e.g. go to login). */
export function onSessionExpired(handler: () => void): void {
  handleSessionExpired = handler;
}

function expireSession(): void {
  tokenStorage.clear('session-expired');
  handleSessionExpired();
}


function isRefreshRejected(refreshError: unknown): boolean {
  if (!axios.isAxiosError(refreshError)) return true;
  const status = refreshError.response?.status;
  return status === 400 || status === 401;
}

const refreshAccessToken = createSingleFlight(async () => {
  const refresh = tokenStorage.getRefreshToken();
  if (!refresh) throw new Error('No refresh token');
  // Plain axios: the refresh call must not go through the interceptors below.
  const { data } = await axios.post<TokenRefresh>(`${apiBaseUrl}/auth/token/refresh/`, {
    refresh,
  });
  tokenStorage.setAccessToken(data.access);
  return data.access;
});

apiClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequestConfig | undefined;
    const isUnauthorized = error.response?.status === 401;
    const isAuthRequest = request?.url?.startsWith(AUTH_PATH_PREFIX) ?? false;

    if (!isUnauthorized || !request || isAuthRequest) {
      return Promise.reject(error);
    }
    if (request._retriedAfterRefresh) {
      expireSession();
      return Promise.reject(error);
    }

    try {
      const accessToken = await refreshAccessToken();
      request._retriedAfterRefresh = true;
      request.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(request);
    } catch (refreshError) {
      if (!isRefreshRejected(refreshError)) return Promise.reject(refreshError);
      expireSession();
      return Promise.reject(error);
    }
  },
);
