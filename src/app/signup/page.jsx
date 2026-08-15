'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { signUp } from '@/hooks/useAuth'
import { isValidBDPhone } from '@/lib/orders'
import AuthCard from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SignupInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || ''
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (form.fullName.trim().length < 2) return setError('Please enter your full name.')
    if (!isValidBDPhone(form.phone)) return setError('Enter a valid 11-digit phone (e.g. 01712345678).')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    setBusy(true)
    const { data, error } = await signUp(form)
    setBusy(false)
    if (error) return setError(error.message)
    // If email confirmation is required, no session is returned.
    if (data?.session) {
      router.push(next || '/account')
      router.refresh()
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <AuthCard title="Check your email" subtitle="We sent you a confirmation link">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="h-10 w-10 text-clay" />
          <p className="text-sm text-stone">Confirm your email address, then log in to start shopping.</p>
          <Link href="/login" className="btn-primary mt-2">Go to login</Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Order with cash on delivery"
      footer={<>Already have an account? <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-clay hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Rahim Ahmed" autoComplete="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01XXXXXXXXX" autoComplete="tel" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm</Label>
            <Input id="confirm" type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} autoComplete="new-password" required />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  )
}
