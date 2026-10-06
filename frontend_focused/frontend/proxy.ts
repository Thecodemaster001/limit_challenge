import { NextResponse, type NextRequest } from 'next/server';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Sends visitors without a session to the login page before any workspace page renders.
 * The cookie is only checked for presence; Django validates it on every API call.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(REFRESH_TOKEN_COOKIE)) {
    return NextResponse.next();
  }
  const loginUrl = new URL('/login', request.url);
  const { pathname, search } = request.nextUrl;
  if (pathname !== '/') {
    loginUrl.searchParams.set('next', `${pathname}${search}`);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api|login|_next/static|_next/image|favicon.ico).*)'],
};
