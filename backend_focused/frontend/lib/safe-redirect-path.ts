const DEFAULT_PATH = '/';

/**
 * Returns `candidate` only if it is a path inside this app, so a crafted
 * `?next=` value cannot send users to another site or run a `javascript:` URL.
 */
export function safeRedirectPath(candidate: string | null | undefined): string {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_PATH;
  }
  if (candidate.includes('\\') || candidate.startsWith('/login')) {
    return DEFAULT_PATH;
  }
  return candidate;
}
