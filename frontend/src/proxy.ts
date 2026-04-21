import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_REDIRECTS: Record<string, string> = {
  '/auth/login': '/login',
  '/auth/register': '/register',
  '/auth/forgot-password': '/forgot-password',
  '/auth/reset-password': '/reset-password',
  '/auth': '/login',
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname in AUTH_REDIRECTS) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTH_REDIRECTS[pathname];
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/:path*'],
};
