import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// Single shared client. Safe to import in server and client components (anon key only).
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

export const PRODUCTS_BUCKET = 'product-images'
