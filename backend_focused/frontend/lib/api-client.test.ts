import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient, onSessionExpired } from './api-client';
import { tokenStorage } from './auth/token-storage';

const VALID_ACCESS_TOKEN = 'fresh-access-token';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
}

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  const response: AxiosResponse = { config, data, status, statusText: '', headers: {} };
  if (status >= 400) {
    return Promise.reject(
      new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response),
    );
  }
  return Promise.resolve(response);
}

let refreshSucceeds: boolean;
const refreshCalls = vi.fn();

// The API accepts only the refreshed access token; the refresh endpoint issues it.
function fakeApi(config: InternalAxiosRequestConfig) {
  if (config.url?.endsWith('/auth/token/refresh/')) {
    refreshCalls();
    return refreshSucceeds
      ? respond(config, 200, { access: VALID_ACCESS_TOKEN })
      : respond(config, 401, { detail: 'Token is invalid or expired' });
  }
  const authorized = config.headers.Authorization === `Bearer ${VALID_ACCESS_TOKEN}`;
  return authorized ? respond(config, 200, { ok: true }) : respond(config, 401, {});
}

describe('apiClient authentication', () => {
  const sessionExpired = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createMemoryStorage(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    apiClient.defaults.adapter = fakeApi;
    axios.defaults.adapter = fakeApi;
    refreshSucceeds = true;
    refreshCalls.mockClear();
    sessionExpired.mockClear();
    onSessionExpired(sessionExpired);
    tokenStorage.saveSession({ access: 'expired-access', refresh: 'refresh', username: 'ann' });
  });

  it('refreshes an expired access token and retries the request', async () => {
    const response = await apiClient.get('/vehicles/');

    expect(response.data).toEqual({ ok: true });
    expect(refreshCalls).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getAccessToken()).toBe(VALID_ACCESS_TOKEN);
  });

  it('shares one refresh between concurrent requests', async () => {
    await Promise.all([
      apiClient.get('/vehicles/'),
      apiClient.get('/offices/'),
      apiClient.get('/mechanics/'),
    ]);

    expect(refreshCalls).toHaveBeenCalledTimes(1);
  });

  it('signs out when the refresh token is no longer valid', async () => {
    refreshSucceeds = false;

    await expect(apiClient.get('/vehicles/')).rejects.toBeInstanceOf(AxiosError);

    expect(sessionExpired).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(tokenStorage.takeSignOutReason()).toBe('session-expired');
  });

  it('does not try to refresh when the login itself is rejected', async () => {
    await expect(
      apiClient.post('/auth/token/', { username: 'ann', password: 'wrong' }),
    ).rejects.toBeInstanceOf(AxiosError);

    expect(refreshCalls).not.toHaveBeenCalled();
    expect(sessionExpired).not.toHaveBeenCalled();
  });
});
