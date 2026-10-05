const ACCESS_TOKEN_KEY = 'fleet.accessToken';
const REFRESH_TOKEN_KEY = 'fleet.refreshToken';
const USERNAME_KEY = 'fleet.username';

export type SignOutReason = 'session-expired';

const listeners = new Set<() => void>();
let lastSignOutReason: SignOutReason | null = null;

function read(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode, quota); the session then lasts until reload.
  }
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Tokens live in localStorage so a session survives reloads. Subscribers are notified on
 * sign-in/out in this tab and, through the `storage` event, in other tabs.
 */
export const tokenStorage = {
  getAccessToken: () => read(ACCESS_TOKEN_KEY),
  getRefreshToken: () => read(REFRESH_TOKEN_KEY),
  getUsername: () => read(USERNAME_KEY),

  setAccessToken: (token: string) => write(ACCESS_TOKEN_KEY, token),

  saveSession: (session: { access: string; refresh: string; username: string }) => {
    lastSignOutReason = null;
    write(ACCESS_TOKEN_KEY, session.access);
    write(REFRESH_TOKEN_KEY, session.refresh);
    write(USERNAME_KEY, session.username);
    notifyListeners();
  },

  clear: (reason: SignOutReason | null = null) => {
    lastSignOutReason = reason;
    write(ACCESS_TOKEN_KEY, null);
    write(REFRESH_TOKEN_KEY, null);
    write(USERNAME_KEY, null);
    notifyListeners();
  },

  /** Returns why the user was last signed out, once. */
  takeSignOutReason: (): SignOutReason | null => {
    const reason = lastSignOutReason;
    lastSignOutReason = null;
    return reason;
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    window.addEventListener('storage', listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', listener);
    };
  },
};
