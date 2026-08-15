'use client'
import { useEffect, useState } from 'react'
import { X, Mail } from 'lucide-react'
import SubscribeForm from './SubscribeForm'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

// Shows once per visitor (after a short delay), inviting them to join the list.
export default function SubscribePopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let dismissed = false
    try {
      dismissed = localStorage.getItem('subscribed') === '1' || localStorage.getItem('sub_dismissed') === '1'
    } catch {}
    if (dismissed) return
    const t = setTimeout(() => setOpen(true), 7000)
    return () => clearTimeout(t)
  }, [])

  function close() {
    setOpen(false)
    try { localStorage.setItem('sub_dismissed', '1') } catch {}
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={close} />
      <div className="animate-float-in relative w-full max-w-md overflow-hidden rounded-3xl border border-line bg-paper p-7 shadow-2xl">
        <button onClick={close} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-stone transition-colors hover:bg-line/60 hover:text-ink">
          <X className="h-5 w-5" />
        </button>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-clay/10 text-clay">
          <Mail className="h-6 w-6" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink">Get new drops & offers</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone">
          Join our list with your email (Gmail works too) and be first to hear about new 3D prints, discounts and restocks.
        </p>
        <div className="mt-5">
          <SubscribeForm source="popup" onDone={() => setTimeout(close, 1500)} />
        </div>
        <button onClick={close} className="mt-4 text-xs text-stone underline-offset-2 hover:underline">
          No thanks, maybe later
        </button>
      </div>
    </div>
  )
}
