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

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
