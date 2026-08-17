'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { isAdminEmail } from '@/lib/config'
import { safeNext } from '@/lib/authRedirect'
import AuthCard from '@/components/auth/AuthCard'

// Finalises the OAuth redirect: supabase-js exchanges the code/hash for a
// session on load; we then send the user to a safe first-party destination.
// Provider cancellations / errors bounce back to /login with a generic message.
function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!supabase) { router.replace('/login'); return }
    if (params.get('error') || params.get('error_description')) {
      router.replace('/login?error=oauth')
      return
    }
    const next = safeNext(params.get('next') || '', '')
    let done = false
    const finish = (session) => {
      if (done || !session) return
      done = true
      const dest = next || (isAdminEmail(session.user?.email) ? '/admin/dashboard' : '/account')
      router.replace(dest)
    }
    supabase.auth.getSession().then(({ data }) => finish(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => finish(s))
    const timer = setTimeout(() => { if (!done) { setFailed(true); router.replace('/login?error=oauth') } }, 8000)
    return () => { sub.subscription.unsubscribe(); clearTimeout(timer) }
  }, [params, router])

  return (
    <AuthCard title="Just a moment" subtitle={failed ? 'Redirecting…' : 'Signing you in securely…'}>
      <div className="flex justify-center py-2 text-clay"><Loader2 className="h-6 w-6 animate-spin" /></div>
    </AuthCard>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  )
}
