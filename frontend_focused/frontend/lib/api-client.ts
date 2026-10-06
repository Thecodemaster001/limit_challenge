import axios, { AxiosError, CreateAxiosDefaults, InternalAxiosRequestConfig } from 'axios';

import { createSingleFlight } from '@/lib/single-flight';

const CSRF_COOKIE_NAME = 'csrftoken';
const SAFE_METHODS = new Set(['get', 'head', 'options']);
// Endpoints that manage the session themselves, so a 401 from them must not trigger a refresh.
const SESSION_ENDPOINTS = ['/auth/csrf/', '/auth/login/', '/auth/refresh/', '/auth/logout/'];

const clientDefaults: CreateAxiosDefaults = {
  baseURL: '/api',
  timeout: 15_000,
  xsrfCookieName: CSRF_COOKIE_NAME,
  xsrfHeaderName: 'X-CSRFToken',
};

export const apiClient = axios.create(clientDefaults);
// Bypasses the interceptors below, so session calls can't recurse into themselves.
const sessionClient = axios.create(clientDefaults);

type RetriableRequestConfig = InternalAxiosRequestConfig & { retriedAfterRefresh?: boolean };

let handleSessionExpired: () => void = () => {};

/** Registers what happens when the session can no longer be refreshed (e.g. go to login). */
export function onSessionExpired(handler: () => void) {
  handleSessionExpired = handler;
}

function hasCsrfCookie() {
  return document.cookie.split('; ').some((cookie) => cookie.startsWith(`${CSRF_COOKIE_NAME}=`));
}

export const ensureCsrfCookie = createSingleFlight(async () => {
  if (!hasCsrfCookie()) await sessionClient.get('/auth/csrf/');
});

const refreshSession = createSingleFlight(async () => {
  await ensureCsrfCookie();
  await sessionClient.post('/auth/refresh/');
});

apiClient.interceptors.request.use(async (config) => {
  if (!SAFE_METHODS.has(config.method ?? 'get')) await ensureCsrfCookie();
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequestConfig | undefined;
    const isSessionRequest = SESSION_ENDPOINTS.some((path) => request?.url === path);

    if (error.response?.status !== 401 || !request || isSessionRequest) {
      return Promise.reject(error);
    }
    if (request.retriedAfterRefresh) {
      handleSessionExpired();
      return Promise.reject(error);
    }

    try {
      await refreshSession();
    } catch (refreshError) {
      const refreshWasRejected =
        axios.isAxiosError(refreshError) && refreshError.response?.status === 401;
      if (refreshWasRejected) handleSessionExpired();
      return Promise.reject(refreshWasRejected ? error : refreshError);
    }
    request.retriedAfterRefresh = true;
    return apiClient(request);
  },
);
