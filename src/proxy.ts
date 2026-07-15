import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, PROTECTED_PREFIXES } from '@/lib/auth/config';
import { verifySessionToken } from '@/lib/auth/token';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authed = !!token && verifySessionToken(token) !== null;

  if (!authed) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/realtor/:path*', '/client/:path*'],
};
