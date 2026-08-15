import { supabase, isSupabaseConfigured } from './supabaseClient'
import { MOCK_PRODUCTS } from './mockData'

// Data-access layer. Server-safe. Uses Supabase when configured, else mock data.
//
// SECURITY: public reads NEVER use `select *`. `production_cost` is an internal,
// admin-only column that the anon role has no column privilege on — selecting it
// (or `*`) as anon would error. Every public query below lists explicit columns.
const PUBLIC_COLUMNS =
  'id,name,slug,price,description,category,tags,image_url,in_stock,created_at,discount_percent,review_url,extra_link,extra_link_label,faqs,is_popular,weight_kg'

const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at)
// Popular items first, then newest.
const byPopular = (a, b) =>
  (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0) || new Date(b.created_at) - new Date(a.created_at)

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

// Pure client-side helpers for search/sort (used by interactive components).
export function searchProducts(products, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return products
  return products.filter((p) => {
    const haystack = [p.name, p.description, p.category, ...(Array.isArray(p.tags) ? p.tags : [])]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function sortProducts(products, sort) {
  const arr = [...products]
  switch (sort) {
    case 'price-asc': return arr.sort((a, b) => a.price - b.price)
    case 'price-desc': return arr.sort((a, b) => b.price - a.price)
    case 'newest': return arr.sort(byNewest)
    case 'popular':
    default: return arr.sort(byPopular)
  }
}
