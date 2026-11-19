import { NextResponse, type NextRequest } from 'next/server';

/*
 * Hebrew is the main site at "/" (served from /he internally), English lives at "/en".
 * "/he/..." redirects to the clean URL so every page has one address per language.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/en' || pathname.startsWith('/en/')) return NextResponse.next();

  if (pathname === '/he' || pathname.startsWith('/he/')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || '/';
    return NextResponse.redirect(url, 308);
  }

  const url = req.nextUrl.clone();
  url.pathname = `/he${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // everything except API routes, the admin, Next internals and files with an extension
  matcher: ['/((?!api|admin|_next|.*\\..*).*)'],
};
