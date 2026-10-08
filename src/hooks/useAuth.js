'use client'
import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { SITE_URL, isAdminEmail } from '@/lib/config'
import { safeNext } from '@/lib/authRedirect'

// One shared auth session for the whole app. Previously every component that
// called useAuth() (e.g. each product card's wishlist button) ran its own
// getSession() + onAuthStateChange subscription — 100+ listeners on the shop
// page. <AuthProvider> (in the root layout) now owns a single subscription and
// every useAuth() reads the same value.
const AuthContext = createContext(null)

function useAuthState() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Token refreshes fire this too; only re-render consumers when the
      // signed-in user (or sign-in state) actually changes.
      setSession((prev) => (prev?.user?.id === s?.user?.id && prev?.access_token === s?.access_token ? prev : s))
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return useMemo(() => {
    const user = session?.user || null
    return { session, user, loading, configured: isSupabaseConfigured, isAdmin: isAdminEmail(user?.email) }
  }, [session, loading])
}

export function AuthProvider({ children }) {
  const value = useAuthState()
  return createElement(AuthContext.Provider, { value }, children)
}

// Tracks the Supabase auth session (shared by customers and the admin area).
// Falls back to a local subscription if used outside <AuthProvider>.
export function useAuth() {
  const shared = useContext(AuthContext)
  const local = useAuthStateIfNeeded(shared)
  return shared || local
}

function useAuthStateIfNeeded(shared) {
  // Hooks must run unconditionally; when a provider exists this local state
  // stays idle (no subscription is created).
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(!shared)
  useEffect(() => {
    if (shared) return
    if (!isSupabaseConfigured) { setLoading(false); return }
    let active = true
    supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false) } })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [shared])
  const user = session?.user || null
  return { session, user, loading, configured: isSupabaseConfigured, isAdmin: isAdminEmail(user?.email) }
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password })
}

// Customer registration. Stores full name + phone in user metadata (a DB
// trigger copies them into public.profiles).
export async function signUp({ email, password, fullName, phone }) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: (fullName || '').trim(), phone: (phone || '').trim() } },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

// Social login. Supabase (GoTrue) performs ALL server-side verification of the
// provider token — signature, issuer, audience/client-id, expiry, nonce/PKCE —
// and creates/links the identity. We never trust profile data from the browser.
// redirectTo is a first-party path only (open-redirect safe). Only minimal
// scopes are requested (email + basic profile).
export async function signInWithProvider(provider, next) {
  const path = safeNext(next, '')
  const redirectTo = `${SITE_URL}/auth/callback${path ? `?next=${encodeURIComponent(path)}` : ''}`
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      scopes: provider === 'facebook' ? 'email' : undefined,
      queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
    },
  })
}

export async function sendPasswordReset(email) {
  return supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${SITE_URL}/reset-password`,
  })
}

export async function updatePassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword })
}
