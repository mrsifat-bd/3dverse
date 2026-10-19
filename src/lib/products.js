import { supabase, isSupabaseConfigured } from './supabaseClient'
import { MOCK_PRODUCTS } from './mockData'

// Data-access layer. Server-safe. Uses Supabase when configured, else mock data.
//
// SECURITY: public reads NEVER use `select *`. `production_cost` is an internal,
// admin-only column that the anon role has no column privilege on — selecting it
// (or `*`) as anon would error. Every public query below lists explicit columns.
const PUBLIC_COLUMNS =
  'id,name,slug,price,description,category,tags,image_url,in_stock,created_at,discount_percent,review_url,extra_link,extra_link_label,faqs,is_popular,weight_kg,name_bn,description_bn'

// Products WITH a photo always rank above products without one, so the shop
// never leads with empty placeholder cards.
const hasImage = (p) => {
  const img = p?.image_url
  return Array.isArray(img) ? Boolean(img[0]) : Boolean(img)
}
const byImage = (a, b) => (hasImage(b) ? 1 : 0) - (hasImage(a) ? 1 : 0)

const byNewest = (a, b) => byImage(a, b) || new Date(b.created_at) - new Date(a.created_at)
// Photo products first, then popular, then newest.
const byPopular = (a, b) =>
  byImage(a, b) ||
  (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0) ||
  new Date(b.created_at) - new Date(a.created_at)

export async function getAllProducts() {
  if (!isSupabaseConfigured) return [...MOCK_PRODUCTS].sort(byPopular)
  const { data, error } = await supabase
    .from('products')
    .select(PUBLIC_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getAllProducts:', error.message)
    return [...MOCK_PRODUCTS].sort(byPopular)
  }
  return (data || []).sort(byPopular)
}

export async function getProductBySlug(slug) {
  if (!isSupabaseConfigured) return MOCK_PRODUCTS.find((p) => p.slug === slug) || null
  const { data, error } = await supabase.from('products').select(PUBLIC_COLUMNS).eq('slug', slug).maybeSingle()
  if (error) {
    console.error('getProductBySlug:', error.message)
    return null
  }
  return data
}

export async function getProductsByCategory(category) {
  const all = await getAllProducts()
  return all.filter((p) => p.category === category).sort(byPopular)
}

export async function getRelatedProducts(product, limit = 4) {
  const all = await getAllProducts()
  return all.filter((p) => p.id !== product.id && p.category === product.category).slice(0, limit)
}

// Featured = popular items first, then newest in-stock.
export async function getFeaturedProducts(limit = 8) {
  const all = await getAllProducts()
  return all.filter((p) => p.in_stock).sort(byPopular).slice(0, limit)
}

export async function getPopularProducts(limit = 8) {
  const all = await getAllProducts()
  return all.filter((p) => p.is_popular).slice(0, limit)
}

export async function getAllSlugs() {
  const all = await getAllProducts()
  return all.map((p) => p.slug)
}

// Only what product cards, search and sorting need. Lists are sent to the
// browser as page data, so dropping FAQs, links, weight and extra photos keeps
// the shop / category / home payloads small. (Search still covers name,
// description, category and tags, exactly as before.)
export function toListProduct(p, categoryNames) {
  if (!p) return p
  const img = p.image_url
  return {
    id: p.id,
    name: p.name,
    name_bn: p.name_bn || undefined,
    slug: p.slug,
    price: p.price,
    description: p.description,
    category: p.category,
    category_name: categoryNames?.[p.category] || p.category_name || undefined,
    tags: p.tags,
    image_url: Array.isArray(img) ? img.slice(0, 1) : img,
    in_stock: p.in_stock,
    created_at: p.created_at,
    discount_percent: p.discount_percent,
    is_popular: p.is_popular,
  }
}

// SEO page title for a product, e.g. "Human Heart Model 3D Printed".
// (The site layout appends " | 3D Verse BD".)
export function productSeoTitle(p) {
  let name = String(p?.name || '').trim()
  if (p?.category === 'medical-bone-models' && !/model|set|skeleton|kit/i.test(name)) name += ' Model'
  return /3d/i.test(name) ? name : `${name} 3D Printed`
}

// Approved, star-rated reviews for structured data (Google only accepts
// ratings from real reviews, so nothing is emitted until there are some).
export async function getReviewSummary(productId) {
  if (!isSupabaseConfigured || !productId) return { count: 0, average: 0, reviews: [] }
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('user_name, comment, rating, created_at')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .not('rating', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error || !data?.length) return { count: 0, average: 0, reviews: [] }
    const average = data.reduce((s, r) => s + Number(r.rating), 0) / data.length
    return { count: data.length, average: Math.round(average * 10) / 10, reviews: data }
  } catch {
    return { count: 0, average: 0, reviews: [] }
  }
}

// Pure client-side helpers for search/sort (used by interactive components).
export function searchProducts(products, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return products
  return products.filter((p) => {
    const haystack = [p.name, p.name_bn, p.description, p.category, p.category_name, ...(Array.isArray(p.tags) ? p.tags : [])].filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function sortProducts(products, sort) {
  const arr = [...products]
  switch (sort) {
    case 'price-asc': return arr.sort((a, b) => byImage(a, b) || a.price - b.price)
    case 'price-desc': return arr.sort((a, b) => byImage(a, b) || b.price - a.price)
    case 'newest': return arr.sort(byNewest)
    case 'popular':
    default: return arr.sort(byPopular)
  }
}
