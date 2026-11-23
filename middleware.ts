import { NextResponse, type NextRequest } from 'next/server';

/*
 * The store is English only and lives at "/" (served from /en internally).
 * Old "/en/..." and "/he/..." links redirect to the clean URL.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const m = pathname.match(/^\/(en|he)(\/.*)?$/);
  if (m) {
    const url = req.nextUrl.clone();
    url.pathname = m[2] || '/';
    return NextResponse.redirect(url, 308);
  }

  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // everything except API routes, the admin, the Hebrew legal pages, Next internals and files with an extension
  matcher: ['/((?!api|admin|legal|_next|.*\\..*).*)'],
};
