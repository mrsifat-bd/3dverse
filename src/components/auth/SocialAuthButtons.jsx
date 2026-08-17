'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { signInWithProvider } from '@/hooks/useAuth'

// Shown only once the providers are configured in Supabase and the flag is set,
// so customers never see a broken button before OAuth is live.
const ENABLED = process.env.NEXT_PUBLIC_SOCIAL_LOGIN === 'true'

function GoogleG({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001 6.19 5.238 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  )
}

function FacebookF({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

export default function SocialAuthButtons({ next = '', className = '' }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  if (!ENABLED) return null

  async function go(provider) {
    if (busy) return
    setBusy(provider); setError('')
    try {
      const { error } = await signInWithProvider(provider, next)
      if (error) { setError('Could not start sign-in. Please try again.'); setBusy('') }
      // On success the browser redirects to the provider; keep the button busy.
    } catch {
      setError('Could not start sign-in. Please try again.'); setBusy('')
    }
  }

  return (
    <div className={className}>
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs uppercase tracking-wider text-stone">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="space-y-2.5">
        <button type="button" onClick={() => go('google')} disabled={Boolean(busy)}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-line/40 disabled:opacity-60">
          {busy === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleG />}
          {busy === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
        </button>
        <button type="button" onClick={() => go('facebook')} disabled={Boolean(busy)}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-line/40 disabled:opacity-60">
          {busy === 'facebook' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FacebookF />}
          {busy === 'facebook' ? 'Connecting to Facebook…' : 'Continue with Facebook'}
        </button>
      </div>
      {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}
