// Language routing. English keeps today's URLs (/shop); Bangla lives under
// /bn (/bn/shop). Both are real, indexable pages that read the same product
// and order data — nothing is duplicated in the database.

export const LOCALES = ['en', 'bn']
export const DEFAULT_LOCALE = 'en'
export const LOCALE_COOKIE = 'lang'
export const BN_PREFIX = '/bn'

// Paths that are never localized (admin panel, API, auth callbacks, files).
const UNLOCALIZED = /^\/(admin|api|auth\/callback|_next)(\/|$)|\.[a-z0-9]{2,5}$/i

export function isLocale(v) {
  return LOCALES.includes(v)
}

export function localeFromPath(pathname = '/') {
  return pathname === BN_PREFIX || pathname.startsWith(BN_PREFIX + '/') ? 'bn' : 'en'
}

// '/bn/shop' -> '/shop', '/bn' -> '/'
export function stripLocale(pathname = '/') {
  if (pathname === BN_PREFIX) return '/'
  if (pathname.startsWith(BN_PREFIX + '/')) return pathname.slice(BN_PREFIX.length)
  return pathname
}

export function isLocalizable(href) {
  if (typeof href !== 'string') return false
  if (!href.startsWith('/') || href.startsWith('//')) return false // external, mailto:, #hash, relative
  const path = href.split(/[?#]/)[0]
  return !UNLOCALIZED.test(path)
}

// Build the URL of `href` in language `lang`. Query strings and hashes are kept.
export function localizeHref(href, lang) {
  if (!isLocalizable(href)) return href
  const m = href.match(/^([^?#]*)(.*)$/)
  const base = stripLocale(m[1] || '/')
  const rest = m[2] || ''
  if (lang !== 'bn') return base + rest
  return (base === '/' ? BN_PREFIX : BN_PREFIX + base) + rest
}

// hreflang alternates for metadata: { canonical, languages }
export function alternatesFor(path, lang = 'en') {
  const en = stripLocale(path || '/')
  const bn = localizeHref(en, 'bn')
  return {
    canonical: lang === 'bn' ? bn : en,
    languages: { en, bn, 'x-default': en },
  }
}

export const HTML_LANG = { en: 'en', bn: 'bn' }
export const INTL_LOCALE = { en: 'en-GB', bn: 'bn-BD' }
