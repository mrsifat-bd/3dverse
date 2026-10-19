// Prices: English keeps '৳1,250'; Bangla uses Bangla digits ('৳১,২৫০').
// The number itself never changes — only how it is written.
export function formatPrice(value, lang = 'en') {
  const n = Number(value) || 0
  return '৳' + n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-IN')
}

export function formatNumber(value, lang = 'en') {
  const n = Number(value) || 0
  return n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-IN')
}

// Dates for customer pages. Order numbers, tracking codes and IDs are never
// passed through here, so they always stay exactly as stored.
export function formatDate(value, lang = 'en', { time = false } = {}) {
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value ?? '')
    const opts = { day: 'numeric', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}) }
    return d.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', opts)
  } catch {
    return String(value ?? '')
  }
}

// Product/category text in the visitor's language, falling back to English
// (the official name) when no Bangla value has been entered yet.
export function localized(record, field, lang = 'en') {
  if (!record) return ''
  if (lang === 'bn') {
    const v = record[`${field}_bn`]
    if (typeof v === 'string' && v.trim()) return v
  }
  return record[field] ?? ''
}

export function firstImage(product) {
  const img = product?.image_url
  if (Array.isArray(img)) return img[0] || null
  return img || null
}

// Card-size (640px) variant of a processed product image. Images uploaded
// through the server pipeline are stored as products/<hash>.webp with a
// products/<hash>-640.webp sibling; anything else is returned unchanged.
const PROCESSED_IMG = /(\/(?:product-images\/products|review-photos\/reviews\/[0-9a-f-]{36})\/[0-9a-f]{32})\.webp$/
export function cardImage(url) {
  if (!url || typeof url !== 'string') return url
  return PROCESSED_IMG.test(url) ? url.replace(PROCESSED_IMG, '$1-640.webp') : url
}

export function allImages(product) {
  const img = product?.image_url
  if (Array.isArray(img)) return img.filter(Boolean)
  return img ? [img] : []
}

// Discount helpers — discount_percent is 1..99 (percent off the list price).
export function hasDiscount(product) {
  const pct = Number(product?.discount_percent) || 0
  return pct > 0 && pct < 100
}

export function effectivePrice(product) {
  const price = Number(product?.price) || 0
  if (!hasDiscount(product)) return price
  const pct = Number(product.discount_percent)
  return Math.round(price * (1 - pct / 100))
}

// Returns a product's OWN valid video URL, or null.
// A video CTA must show only when THIS product has a real link — never a
// shared/global or another product's fallback. Rejects null, empty string,
// whitespace-only, non-strings, and anything that isn't a valid http(s) URL.
export function productVideoUrl(product) {
  const raw = product?.review_url
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return trimmed
  } catch {
    return null
  }
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Which script a piece of free text is written in — used to mark product data
// (FAQs, reviews) with the right lang attribute when it isn't in the page's
// language. Bangla letters anywhere => 'bn'.
export function textLang(text = '') {
  return /[ঀ-৿]/.test(String(text)) ? 'bn' : 'en'
}
