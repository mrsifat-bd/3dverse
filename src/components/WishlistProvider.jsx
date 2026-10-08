'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

// Loads the signed-in customer's wishlist ONCE (one query for all product ids)
// and shares it with every wishlist button. Previously each product card ran
// its own auth lookup + wishlist query, so the shop page fired 200+ requests.
const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id || null
  const [ids, setIds] = useState(() => new Set())

  useEffect(() => {
    let active = true
    if (!userId || !isSupabaseConfigured) { setIds(new Set()); return }
    supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (active && !error) setIds(new Set((data || []).map((r) => r.product_id)))
      })
    return () => { active = false }
  }, [userId])

  // Optimistic toggle; returns the new saved state. Throws LOGIN_REQUIRED
  // when signed out (callers redirect to the login page).
  const toggle = useCallback(async (productId) => {
    if (!userId) throw new Error('LOGIN_REQUIRED')
    const wasSaved = ids.has(productId)
    const apply = (saved) => setIds((prev) => {
      const next = new Set(prev)
      if (saved) next.add(productId); else next.delete(productId)
      return next
    })
    apply(!wasSaved)
    const q = wasSaved
      ? supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId)
      : supabase.from('wishlists').insert({ user_id: userId, product_id: productId })
    const { error } = await q
    if (error) { apply(wasSaved); throw error }
    return !wasSaved
  }, [ids, userId])

  const value = useMemo(() => ({ ids, toggle, signedIn: Boolean(userId) }), [ids, toggle, userId])
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  return useContext(WishlistContext)
}
