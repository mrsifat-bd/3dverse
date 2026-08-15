export function formatPrice(value) {
  const n = Number(value) || 0
  return '৳' + n.toLocaleString('en-IN')
}

export function firstImage(product) {
  const img = product?.image_url
  if (Array.isArray(img)) return img[0] || null
  return img || null
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

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
