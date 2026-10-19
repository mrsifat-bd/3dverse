import { DEFAULT_LOCALE } from './config'

function lookup(dict, key) {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict)
}

function humanize(key) {
  const last = key.split('.').pop() || ''
  return last.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())
}

// Build a translate function over a set of dictionaries ({ en, bn }).
// - Missing Bangla text falls back to English.
// - A key missing everywhere shows a readable word, never "a.b.c".
// - Strings may contain {name} placeholders; values may also be functions.
export function makeTranslator(dicts, lang) {
  const primary = dicts[lang] || dicts[DEFAULT_LOCALE]
  const fallback = dicts[DEFAULT_LOCALE]
  return function t(key, vars) {
    let s = lookup(primary, key)
    if (s == null && primary !== fallback) s = lookup(fallback, key)
    if (s == null) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing key: ${key}`)
      return humanize(key)
    }
    if (typeof s === 'function') return s(vars || {})
    if (vars && typeof s === 'string') return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m))
    return s
  }
}

// Lists/objects of copy (policy sections, FAQ lists) with English fallback.
export function pick(dicts, lang, key) {
  return lookup(dicts[lang], key) ?? lookup(dicts[DEFAULT_LOCALE], key)
}
