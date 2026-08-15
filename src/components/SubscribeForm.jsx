'use client'
import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { subscribe } from '@/lib/subscribers'

export default function SubscribeForm({ source = 'site', onDone }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const r = await subscribe(email, { source })
    setBusy(false)
    if (r.ok) {
      setDone(true)
      try { localStorage.setItem('subscribed', '1') } catch {}
      onDone && onDone()
    } else {
      setErr(r.error)
    }
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-clay">
        <Check className="h-4 w-4" /> Thanks — you&apos;re on the list!
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="h-11 w-full rounded-full border border-line bg-paper px-4 text-sm text-ink placeholder:text-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <button type="submit" disabled={busy} className="btn-primary shrink-0">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </form>
  )
}
