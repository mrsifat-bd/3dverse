import { NextResponse } from 'next/server'
import { LOCALE_COOKIE, localeFromPath, localizeHref, isLocalizable } from '@/i18n/config'

// Language routing for customer pages.
//
//   /shop     -> English. Served from the internal /en/shop route; the URL in
//                the address bar never changes, so existing links and SEO stay.
//   /bn/shop  -> Bangla (a real, indexable URL).
//   /en/shop  -> redirected to /shop (one URL per page, no duplicates).
//
// A visitor who picked Bangla (cookie set by the language switcher) and opens
// an English URL — a bookmark, a shared link — gets the same page in Bangla.
// Search engines send no cookie, so they always get the URL they asked for.
export function middleware(req) {
  const { pathname, search } = req.nextUrl

  if (!isLocalizable(pathname)) return NextResponse.next()

  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const url = req.nextUrl.clone()
    url.pathname = pathname.slice(3) || '/'
    url.search = search
    return NextResponse.redirect(url, 308)
  }

  const lang = localeFromPath(pathname)
  if (lang === 'bn') {
    const res = NextResponse.next()
    res.headers.set('Content-Language', 'bn')
    return res
  }

  if (req.cookies.get(LOCALE_COOKIE)?.value === 'bn') {
    const url = req.nextUrl.clone()
    url.pathname = localizeHref(pathname, 'bn')
    url.search = search
    return NextResponse.redirect(url, 307)
  }

  const url = req.nextUrl.clone()
  url.pathname = pathname === '/' ? '/en' : `/en${pathname}`
  url.search = search
  const res = NextResponse.rewrite(url)
  res.headers.set('Content-Language', 'en')
  return res
}

export const config = {
  // Pages only: skip API, admin, auth callback, Next internals and files.
  matcher: ['/((?!api|admin|auth/callback|_next|.*\\..*).*)'],
}
