'use client'
import { useState } from 'react'
import Link from '@/components/LocalizedLink'
import { useT, useLocalizedRouter } from '@/i18n/client'
import { authErrorKey } from '@/lib/authErrors'
import { Loader2 } from 'lucide-react'
import { updatePassword } from '@/hooks/useAuth'
import AuthCard from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Reached from the password-reset email link (Supabase sets a recovery session).
export default function ResetPasswordPage() {
  const router = useLocalizedRouter()
  const t = useT()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    // Same rule as sign-up (it used to be 6 here and 8 there).
    if (password.length < 8) return setError(t('auth.passwordShort'))
    if (password !== confirm) return setError(t('auth.passwordMismatch'))
    setBusy(true)
    const { error } = await updatePassword(password)
    setBusy(false)
    if (error) return setError(t(authErrorKey(error.message)))
    setDone(true)
    setTimeout(() => router.push('/account'), 1200)
  }

  return (
    <AuthCard title={t('auth.newPasswordTitle')} subtitle={done ? t('auth.passwordUpdated') : t('auth.newPasswordSubtitle')}>
      {done ? (
        <p className="text-center text-sm text-stone">{t('auth.passwordUpdatedText')}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">{t('auth.newPassword')}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('auth.updating')}</> : t('auth.updatePassword')}
          </Button>
          <p className="text-center text-xs text-stone"><Link href="/login" className="text-clay hover:underline">{t('auth.backToLogin')}</Link></p>
        </form>
      )}
    </AuthCard>
  )
}
