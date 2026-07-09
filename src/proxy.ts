import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, PROTECTED_PREFIXES, SITE_PASSWORD } from '@/lib/auth/config';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const authed = request.cookies.get(AUTH_COOKIE_NAME)?.value === SITE_PASSWORD;

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
