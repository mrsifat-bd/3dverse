import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import uiEn from '../../i18n/ui/en'
import uiBn from '../../i18n/ui/bn'
import contentEn from '../../i18n/content/en'
import contentBn from '../../i18n/content/bn'
import { makeTranslator } from '../../i18n/core'
import { localizeHref, stripLocale, localeFromPath, alternatesFor, isLocalizable } from '../../i18n/config'
import { EN_FAQ, BN_FAQ } from '../faq'

function keys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`])
}
function has(obj, key) {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj) !== undefined
}
function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) return f === '__tests__' || f === 'admin' ? [] : files(p)
    return /\.(jsx?|mjs)$/.test(f) ? [p] : []
  })
}

describe('translation dictionaries', () => {
  it('Bangla and English interface text have exactly the same keys', () => {
    expect(keys(uiBn).sort()).toEqual(keys(uiEn).sort())
  })
  it('Bangla and English page copy have the same keys (except categoryBlurbs)', () => {
    const strip = (k) => !k.startsWith('categoryBlurbs.')
    expect(keys(contentBn).filter(strip).sort()).toEqual(keys(contentEn).filter(strip).sort())
  })
  it('no empty strings in either language', () => {
    for (const [name, d] of [['ui.en', uiEn], ['ui.bn', uiBn]]) {
      for (const k of keys(d)) {
        const v = k.split('.').reduce((o, p) => o[p], d)
        expect(typeof v === 'string' ? v.trim().length : 1, `${name}:${k}`).toBeGreaterThan(0)
      }
    }
  })
  it('every literal t("…") key used in the code exists', () => {
    const src = join(__dirname, '..', '..')
    const all = { ...uiEn, ...contentEn }
    const missing = []
    for (const f of files(src)) {
      const text = readFileSync(f, 'utf8')
      if (!/useT\(|getServerT\(|getT\(/.test(text)) continue
      for (const m of text.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) {
        if (!has(all, m[1])) missing.push(`${f.replace(src, '')}: ${m[1]}`)
      }
    }
    expect(missing).toEqual([])
  })
  it('order status labels cover every lifecycle state', () => {
    for (const s of ['new', 'confirmed', 'ready', 'sent_to_steadfast', 'shipped', 'delivered', 'cancelled', 'returned', 'failed']) {
      expect(has(uiEn, `orders.status.${s}`)).toBe(true)
      expect(has(uiBn, `orders.status.${s}`)).toBe(true)
    }
  })
  it('missing Bangla falls back to English, unknown keys never show raw', () => {
    const t = makeTranslator({ en: { a: { b: 'Hello {name}' } }, bn: {} }, 'bn')
    expect(t('a.b', { name: 'Rahim' })).toBe('Hello Rahim')
    expect(t('x.someLabel')).toBe('Some Label')
  })
  it('FAQ has the same questions in both languages', () => {
    expect(BN_FAQ.length).toBe(EN_FAQ.length)
  })
})

describe('language URLs', () => {
  it('English keeps existing URLs, Bangla lives under /bn', () => {
    expect(localizeHref('/shop?q=heart#x', 'bn')).toBe('/bn/shop?q=heart#x')
    expect(localizeHref('/', 'bn')).toBe('/bn')
    expect(localizeHref('/bn/product/a', 'en')).toBe('/product/a')
    expect(localizeHref('/bn/product/a', 'bn')).toBe('/bn/product/a')
    expect(stripLocale('/bn')).toBe('/')
    expect(localeFromPath('/bn/cart')).toBe('bn')
    expect(localeFromPath('/brand')).toBe('en') // not fooled by a /bn prefix lookalike
  })
  it('admin, API, auth callback and external links are never localized', () => {
    for (const h of ['/admin/orders', '/api/x', '/auth/callback', 'https://wa.me/1', 'mailto:a@b.c', '#top', '/logo.png']) {
      expect(isLocalizable(h)).toBe(false)
      expect(localizeHref(h, 'bn')).toBe(h)
    }
  })
  it('hreflang alternates point at both versions', () => {
    expect(alternatesFor('/bn/faq', 'bn')).toEqual({ canonical: '/bn/faq', languages: { en: '/faq', bn: '/bn/faq', 'x-default': '/faq' } })
  })
})
