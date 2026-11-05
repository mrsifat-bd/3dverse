'use client'
import { clampQty } from '@/lib/cart'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { recordLead } from '@/lib/leads'
import {
  readGuestCart, writeGuestCart, clearGuestCart,
  dbGetCart, dbAdd, dbSetQty, dbRemove, dbClear, dbMergeGuest,
  enrichLine, cartTotals,
  SKELETON_LINE_ID, isSkeletonLine, serverSkeletonQuote, skeletonLine, refreshSkeletonLine,
  dbGetSkeleton, dbSetSkeleton, dbClearSkeleton,
} from '@/lib/cart'

const CartContext = createContext(null)
export function useCart() {
  return useContext(CartContext)
}

// Logged-in cart: product lines plus the saved builder configuration.
async function loadDbCart() {
  const products = await dbGetCart()
  let sk = null
  try { sk = await dbGetSkeleton() } catch {}
  return sk ? [...products, sk] : products
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const mergedRef = useRef(false)

  // Load cart (and merge a guest cart into the account on login).
  useEffect(() => {
    if (authLoading) return
    let active = true
    ;(async () => {
      if (user) {
        if (!mergedRef.current) {
          const guest = readGuestCart()
          if (guest.length) { await dbMergeGuest(guest); clearGuestCart() }
          mergedRef.current = true
        }
        try { const c = await loadDbCart(); if (active) setLines(c) } catch { if (active) setLines([]) }
      } else {
        mergedRef.current = false
        const guest = readGuestCart()
        // A builder line in a guest cart is re-priced by the server on every load.
        const sk = guest.find(isSkeletonLine)
        const rest = guest.filter((l) => !isSkeletonLine(l))
        const fresh = sk ? await refreshSkeletonLine(sk).catch(() => null) : null
        if (active) setLines(fresh ? [...rest, fresh] : rest)
      }
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [user, authLoading])

  // Persist the guest cart whenever it changes.
  // (Only after the first load, so the empty initial state never overwrites it.)
  useEffect(() => { if (!user && !loading) writeGuestCart(lines) }, [lines, user, loading])

  const add = useCallback(async (product, qty = 1) => {
    // Dashboard funnel: count one "added to cart" per product per visit
    // (no location lookup; never blocks adding).
    try {
      const key = 'lead_cart_' + (product?.slug || product?.id)
      if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); recordLead({ action: 'add_to_cart', product, geo: false }) }
    } catch {}
    if (user) { await dbAdd(product.id, qty); setLines(await loadDbCart()) }
    else setLines((prev) => {
      const i = prev.findIndex((l) => l.product_id === product.id)
      if (i >= 0) { const copy = [...prev]; copy[i] = { ...copy[i], quantity: clampQty(copy[i].quantity + qty) }; return copy }
      return [...prev, enrichLine(product, qty)]
    })
  }, [user])

  const setQty = useCallback(async (productId, qty) => {
    if (productId === SKELETON_LINE_ID) return // one builder configuration; edit it in the builder
    const q = clampQty(qty)
    if (user) { await dbSetQty(productId, q); setLines(await loadDbCart()) }
    else setLines((prev) => prev.map((l) => (l.product_id === productId ? { ...l, quantity: q } : l)))
  }, [user])

  const remove = useCallback(async (productId) => {
    if (productId === SKELETON_LINE_ID) {
      if (user) { try { await dbClearSkeleton() } catch {} }
      setLines((prev) => prev.filter((l) => !isSkeletonLine(l)))
      return
    }
    if (user) { await dbRemove(productId); setLines(await loadDbCart()) }
    else setLines((prev) => prev.filter((l) => l.product_id !== productId))
  }, [user])

  const clear = useCallback(async () => {
    if (user) { await dbClear(); setLines([]) }
    else { setLines([]); clearGuestCart() }
  }, [user])

  // Put a builder configuration into the cart (replaces any earlier one). The
  // price shown is the server's quote; checkout re-prices it again.
  const setSkeleton = useCallback(async (config) => {
    const q = await serverSkeletonQuote(config)
    if (!q?.ok || !(Number(q.total) > 0)) return { ok: false, error: q?.error || 'invalid' }
    if (user) {
      try { await dbSetSkeleton(config) } catch (e) { return { ok: false, error: e.message } }
    }
    const line = skeletonLine(config, q)
    setLines((prev) => [...prev.filter((l) => !isSkeletonLine(l)), line])
    try { recordLead({ action: 'add_to_cart', product: { id: SKELETON_LINE_ID, slug: SKELETON_LINE_ID, name: line.name }, geo: false }) } catch {}
    return { ok: true, quote: q }
  }, [user])

  const totals = cartTotals(lines)
  const skeleton = lines.find(isSkeletonLine) || null
  const value = { lines, loading, add, setQty, remove, clear, setSkeleton, skeleton, isLoggedIn: !!user, ...totals }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
