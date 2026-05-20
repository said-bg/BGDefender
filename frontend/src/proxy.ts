import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  LOCALE_COOKIE,
  localizePathname,
  normalizeLocale,
  stripLocaleFromPathname,
} from '@/lib/locale';

const AUTH_REDIRECTS: Record<string, string> = {
  '/auth/login': '/login',
  '/auth/register': '/register',
  '/auth/forgot-password': '/forgot-password',
  '/auth/reset-password': '/reset-password',
  '/auth': '/login',
};

const PUBLIC_FILE = /\.[^/]+$/;

const applySecurityHeaders = (response: NextResponse) => {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  return response;
};

const detectLocale = (request: NextRequest) => {
  const rawCookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (rawCookieLocale) {
    return normalizeLocale(rawCookieLocale);
  }

  return DEFAULT_LOCALE;
};

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname in AUTH_REDIRECTS) {
    const redirectUrl = request.nextUrl.clone();
    const targetPath = AUTH_REDIRECTS[pathname];
    const pathnameLocale = getLocaleFromPathname(pathname);
    redirectUrl.pathname = localizePathname(targetPath, pathnameLocale ?? detectLocale(request));
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  const pathnameLocale = getLocaleFromPathname(pathname);

  if (!pathnameLocale) {
    const locale = detectLocale(request);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localizePathname(pathname, locale);
    redirectUrl.search = search;

    const response = applySecurityHeaders(NextResponse.redirect(redirectUrl));
    response.cookies.set(LOCALE_COOKIE, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-current-locale', pathnameLocale);
  requestHeaders.set('x-current-path', pathname);

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = stripLocaleFromPathname(pathname);
  rewriteUrl.search = search;

  const response = applySecurityHeaders(
    NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    }),
  );

  response.cookies.set(LOCALE_COOKIE, pathnameLocale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
