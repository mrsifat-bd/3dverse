'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { updatePassword } from '@/hooks/useAuth'
import AuthCard from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Reached from the password-reset email link (Supabase sets a recovery session).
export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    const { error } = await updatePassword(password)
    setBusy(false)
    if (error) return setError(error.message)
    setDone(true)
    setTimeout(() => router.push('/account'), 1200)
  }

  return (
    <AuthCard title="Set a new password" subtitle={done ? 'Password updated' : 'Choose a new password for your account'}>
      {done ? (
        <p className="text-center text-sm text-stone">Your password has been updated. Redirecting…</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : 'Update password'}
          </Button>
          <p className="text-center text-xs text-stone"><Link href="/login" className="text-clay hover:underline">Back to login</Link></p>
        </form>
      )}
    </AuthCard>
  )
}
