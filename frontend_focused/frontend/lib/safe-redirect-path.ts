import { SUBMISSIONS_PATH } from '@/lib/list-return-path';

export const DEFAULT_PATH = SUBMISSIONS_PATH;
// Placeholder origin used only to resolve the candidate the way a browser would.
const APP_ORIGIN = 'http://app.invalid';

/**
 * Returns `candidate` only if it is a path inside this app, so a crafted
 * `?next=` value cannot send users to another site or run a `javascript:` URL.
 * The candidate is resolved with `URL` because browsers strip tabs and newlines and
 * read `\` as `/`, which can turn an innocent-looking path such as `/\t/evil.example`
 * into `//evil.example`.
 */
export function safeRedirectPath(candidate: string | null | undefined): string {
  if (!candidate || !candidate.startsWith('/')) {
    return DEFAULT_PATH;
  }
  const url = new URL(candidate, APP_ORIGIN);
  if (url.origin !== APP_ORIGIN || url.pathname.startsWith('/login')) {
    return DEFAULT_PATH;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
