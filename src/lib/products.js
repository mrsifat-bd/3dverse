import { supabase, isSupabaseConfigured } from './supabaseClient'
import { MOCK_PRODUCTS } from './mockData'

// Data-access layer. Server-safe. Uses Supabase when configured, else mock data.

const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at)

export async function getAllProducts() {
  if (!isSupabaseConfigured) return [...MOCK_PRODUCTS].sort(byNewest)
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getAllProducts:', error.message)
    return [...MOCK_PRODUCTS].sort(byNewest)
  }
  return data || []
}

export async function getProductBySlug(slug) {
  if (!isSupabaseConfigured) return MOCK_PRODUCTS.find((p) => p.slug === slug) || null
  const { data, error } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle()
  if (error) {
    console.error('getProductBySlug:', error.message)
    return null
  }
  return data
}

export async function getProductsByCategory(category) {
  const all = await getAllProducts()
  return all.filter((p) => p.category === category).sort(byNewest)
}

export async function getRelatedProducts(product, limit = 4) {
  const all = await getAllProducts()
  return all.filter((p) => p.id !== product.id && p.category === product.category).slice(0, limit)
}

export async function getFeaturedProducts(limit = 8) {
  const all = await getAllProducts()
  return all.filter((p) => p.in_stock).sort(byNewest).slice(0, limit)
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
    default: return arr.sort(byNewest)
  }
}
