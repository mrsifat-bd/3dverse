'use client'
import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { SITE_URL, isAdminEmail } from '@/lib/config'
import { safeNext } from '@/lib/authRedirect'

// Tracks the Supabase auth session (shared by customers and the admin area).
export function useAuth() {
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
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const user = session?.user || null
  return {
    session,
    user,
    loading,
    configured: isSupabaseConfigured,
    isAdmin: isAdminEmail(user?.email),
  }
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
