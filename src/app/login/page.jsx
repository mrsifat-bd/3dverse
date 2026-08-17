'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { signIn } from '@/hooks/useAuth'
import { isAdminEmail } from '@/lib/config'
import { safeNext } from '@/lib/authRedirect'
import AuthCard from '@/components/auth/AuthCard'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || ''
  const oauthError = params.get('error') === 'oauth'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { data, error } = await signIn(email, password)
    setBusy(false)
    // Generic message — never reveal whether the email exists (anti-enumeration).
    if (error) { setError('Invalid email or password.'); return }
    const dest = safeNext(next, isAdminEmail(data?.user?.email) ? '/admin/dashboard' : '/account')
    router.push(dest)
    router.refresh()
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to your 3D Verse account"
      footer={<>New here? <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-clay hover:underline">Create an account</Link></>}
    >
      {oauthError && <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">Sign-in was cancelled or could not be completed. Please try again.</p>}
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-clay hover:underline">Forgot?</Link>
          </div>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Logging in…</> : 'Log in'}
        </Button>
      </form>
      <SocialAuthButtons next={next} />
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
