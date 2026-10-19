// Server components only (never import from a 'use client' file: it would ship all page copy to the browser).
// Server components: interface text + long page copy (policies, About, SEO).
import uiEn from './ui/en'
import uiBn from './ui/bn'
import contentEn from './content/en'
import contentBn from './content/bn'
import { makeTranslator, pick } from './core'

// Namespaces that exist in both (e.g. "home") are merged, not replaced.
function merge(a, b) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = out[k] && typeof out[k] === 'object' && !Array.isArray(out[k]) && typeof v === 'object' && !Array.isArray(v) ? { ...out[k], ...v } : v
  return out
}
const ALL = { en: merge(uiEn, contentEn), bn: merge(uiBn, contentBn) }

export function getServerT(lang) {
  return makeTranslator(ALL, lang)
}

export function getContent(lang, key) {
  return pick(ALL, lang, key)
}
