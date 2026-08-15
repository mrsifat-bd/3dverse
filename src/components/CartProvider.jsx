'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  readGuestCart, writeGuestCart, clearGuestCart,
  dbGetCart, dbAdd, dbSetQty, dbRemove, dbClear, dbMergeGuest,
  enrichLine, cartTotals,
} from '@/lib/cart'

const CartContext = createContext(null)
export function useCart() {
  return useContext(CartContext)
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
        try { const c = await dbGetCart(); if (active) setLines(c) } catch { if (active) setLines([]) }
      } else {
        mergedRef.current = false
        if (active) setLines(readGuestCart())
      }
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [user, authLoading])

  // Persist the guest cart whenever it changes.
  useEffect(() => { if (!user) writeGuestCart(lines) }, [lines, user])

  const add = useCallback(async (product, qty = 1) => {
    if (user) { await dbAdd(product.id, qty); setLines(await dbGetCart()) }
    else setLines((prev) => {
      const i = prev.findIndex((l) => l.product_id === product.id)
      if (i >= 0) { const copy = [...prev]; copy[i] = { ...copy[i], quantity: copy[i].quantity + qty }; return copy }
      return [...prev, enrichLine(product, qty)]
    })
  }, [user])

  const setQty = useCallback(async (productId, qty) => {
    const q = Math.max(1, Math.round(qty))
    if (user) { await dbSetQty(productId, q); setLines(await dbGetCart()) }
    else setLines((prev) => prev.map((l) => (l.product_id === productId ? { ...l, quantity: q } : l)))
  }, [user])

  const remove = useCallback(async (productId) => {
    if (user) { await dbRemove(productId); setLines(await dbGetCart()) }
    else setLines((prev) => prev.filter((l) => l.product_id !== productId))
  }, [user])

  const clear = useCallback(async () => {
    if (user) { await dbClear(); setLines([]) }
    else { setLines([]); clearGuestCart() }
  }, [user])

  const totals = cartTotals(lines)
  const value = { lines, loading, add, setQty, remove, clear, isLoggedIn: !!user, ...totals }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
