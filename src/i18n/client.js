'use client'
import { useCallback, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { localeFromPath, localizeHref, LOCALE_COOKIE } from './config'
import { getT } from './index'

// The language comes from the URL (/bn/... = Bangla), so it is correct during
// server rendering too — no flash of the wrong language.
export function useLang() {
  const pathname = usePathname() || '/'
  return localeFromPath(pathname)
}

export function useT() {
  const lang = useLang()
  return useMemo(() => getT(lang), [lang])
}

// next/navigation's router, but every path is kept in the current language.
export function useLocalizedRouter() {
  const router = useRouter()
  const lang = useLang()
  return useMemo(
    () => ({
      ...router,
      push: (href, opts) => router.push(localizeHref(href, lang), opts),
      replace: (href, opts) => router.replace(localizeHref(href, lang), opts),
      prefetch: (href, opts) => router.prefetch(localizeHref(href, lang), opts),
      back: router.back,
      refresh: router.refresh,
      forward: router.forward,
    }),
    [router, lang],
  )
}

export function useLocalizeHref() {
  const lang = useLang()
  return useCallback((href) => localizeHref(href, lang), [lang])
}

// Remember an explicit choice for a year (read by the middleware).
export function rememberLang(lang) {
  try {
    document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`
  } catch {}
  try { localStorage.setItem(LOCALE_COOKIE, lang) } catch {}
}
