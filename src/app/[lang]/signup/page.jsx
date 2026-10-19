'use client'
import { Suspense, useState } from 'react'
import Link from '@/components/LocalizedLink'
import { useSearchParams } from 'next/navigation'
import { useT, useLocalizedRouter } from '@/i18n/client'
import { authErrorKey } from '@/lib/authErrors'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { signUp } from '@/hooks/useAuth'
import { isValidBDPhone } from '@/lib/orders'
import { safeNext } from '@/lib/authRedirect'
import AuthCard from '@/components/auth/AuthCard'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SignupInner() {
  const router = useLocalizedRouter()
  const t = useT()
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
    if (form.fullName.trim().length < 2) return setError(t('form.nameRequired'))
    if (!isValidBDPhone(form.phone)) return setError(t('form.phoneInvalid'))
    if (form.password.length < 8) return setError(t('auth.passwordShort'))
    if (form.password !== form.confirm) return setError(t('auth.passwordMismatch'))
    setBusy(true)
    const { data, error } = await signUp(form)
    setBusy(false)
    if (error) return setError(t(authErrorKey(error.message)))
    // If email confirmation is required, no session is returned.
    if (data?.session) {
      router.push(safeNext(next, '/account'))
      router.refresh()
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <AuthCard title={t('auth.checkEmail')} subtitle={t('auth.confirmSent')}>
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="h-10 w-10 text-clay" />
          <p className="text-sm text-stone">{t('auth.confirmText')}</p>
          <Link href="/login" className="btn-primary mt-2">{t('auth.goToLogin')}</Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title={t('auth.signupTitle')}
      subtitle={t('auth.signupSubtitle')}
      footer={<>{t('auth.haveAccount')} <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-clay hover:underline">{t('auth.logIn')}</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t('form.fullName')}</Label>
          <Input id="name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder={t('form.namePlaceholder')} autoComplete="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t('form.phone')}</Label>
          <Input id="phone" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01XXXXXXXXX" autoComplete="tel" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">{t('auth.confirmShort')}</Label>
            <Input id="confirm" type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} autoComplete="new-password" required />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('auth.creating')}</> : t('auth.createAccount')}
        </Button>
      </form>
      <SocialAuthButtons next={next} />
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
