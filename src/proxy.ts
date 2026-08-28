import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'abc_session';
const PUBLIC_PATHS = ['/signin', '/data-deletion', '/auth/instagram'];

// Cheap cookie-presence gate only — no API calls here (runs on every request).
// Whether the session is actually valid is decided by the API: server fetches
// funnel 401s to /signin.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) return NextResponse.next();

  if (!request.cookies.has(SESSION_COOKIE)) {
    const signin = new URL('/signin', request.url);
    return NextResponse.redirect(signin);
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next internals and any file request (public/ assets, icons) —
  // app routes never contain a dot.
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
