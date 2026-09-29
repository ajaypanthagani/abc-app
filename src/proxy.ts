import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'abc_session';
const STAFF_SESSION_COOKIE = 'abc_staff_session';
const PUBLIC_PATHS = ['/signin', '/data-deletion', '/auth/instagram', '/admin/signin'];

// Cheap cookie-presence gate only — no API calls here (runs on every request).
// Whether the session is actually valid is decided by the API: server fetches
// funnel 401s to /signin (creators) or /admin/signin (ops console).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) return NextResponse.next();

  // The ops console has its own cookie so staff and creator sign-ins coexist.
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const cookie = isAdmin ? STAFF_SESSION_COOKIE : SESSION_COOKIE;
  if (!request.cookies.has(cookie)) {
    return NextResponse.redirect(new URL(isAdmin ? '/admin/signin' : '/signin', request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next internals and any file request (public/ assets, icons) —
  // app routes never contain a dot.
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
