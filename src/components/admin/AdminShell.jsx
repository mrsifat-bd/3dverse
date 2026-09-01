'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Tags, ShoppingBag, MessageSquare, Users, Mail, Settings, LogOut, Home, Loader2, Calculator } from 'lucide-react'
import { useAuth, signIn, signOut } from '@/hooks/useAuth'
import { BUSINESS } from '@/lib/config'
import { cn } from '@/lib/utils'
import NotificationBell from '@/components/admin/NotificationBell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', Icon: Package },
  { href: '/admin/cost-estimator', label: 'Cost Estimator', Icon: Calculator },
  { href: '/admin/orders', label: 'Orders', Icon: ShoppingBag },
  { href: '/admin/comments', label: 'Reviews', Icon: MessageSquare },
  { href: '/admin/leads', label: 'Leads', Icon: Users },
  { href: '/admin/subscribers', label: 'Subscribers', Icon: Mail },
  { href: '/admin/settings', label: 'Settings', Icon: Settings },
]

function CenterCard({ children }) {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-3xl border border-line bg-paper p-8">{children}</div>
    </div>
  )
}

export default function AdminShell({ children }) {
  const { session, loading, configured } = useAuth()
  const pathname = usePathname()

  if (!configured) {
    return (
      <CenterCard>
        <h1 className="font-display text-2xl font-semibold text-ink">Admin needs Supabase</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          The admin panel uses Supabase Auth. Add your <code className="text-ink">NEXT_PUBLIC_SUPABASE_URL</code> and
          <code className="text-ink"> NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code className="text-ink">.env.local</code>,
          create an admin user in the Supabase dashboard, then reload.
        </p>
        <Link href="/" className="btn-ghost mt-6">Back to site</Link>
      </CenterCard>
    )
  }

  if (loading) {
    return (
      <CenterCard>
        <div className="flex items-center justify-center gap-2 text-stone">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      </CenterCard>
    )
  }

  if (!session) return <LoginForm />

  return (
    <div className="container grid gap-6 py-6 md:grid-cols-[220px_1fr] md:gap-8 md:py-10">
      <aside className="h-fit rounded-2xl border border-line bg-paper p-3 md:sticky md:top-24 md:p-4">
        <p className="hidden px-2 pb-3 font-display text-lg font-semibold text-ink md:block">{BUSINESS.name} admin</p>
        {/* Horizontal scroll strip on mobile, vertical sidebar on desktop. */}
        <nav className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:gap-0 md:space-y-1.5 md:overflow-x-visible md:pb-0">
          {nav.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-all duration-200 md:gap-3 md:py-2.5',
                pathname.startsWith(href) ? 'bg-clay/10 font-medium text-clay' : 'text-ink/80 hover:bg-line/50 md:hover:translate-x-0.5'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 flex gap-1.5 overflow-x-auto border-t border-line pt-3 md:mt-4 md:flex-col md:gap-0 md:space-y-1.5 md:overflow-x-visible md:pt-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-ink/80 transition-all duration-200 hover:bg-line/50 md:gap-3 md:py-2.5 md:hover:translate-x-0.5">
            <Home className="h-4 w-4 shrink-0" /> View site
          </Link>
          <button onClick={() => signOut()} className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-ink/80 transition-all duration-200 hover:bg-line/50 md:w-full md:gap-3 md:py-2.5 md:hover:translate-x-0.5">
            <LogOut className="h-4 w-4 shrink-0" /> Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="mb-5 flex items-center gap-3">
          <p className="font-display text-lg font-semibold text-ink md:hidden">{BUSINESS.name} admin</p>
          <div className="ml-auto"><NotificationBell /></div>
        </div>
        {children}
      </div>
    </div>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <CenterCard>
      <h1 className="font-display text-2xl font-semibold text-ink">Admin sign in</h1>
      <p className="mt-1 text-sm text-stone">Use the owner account created in Supabase Auth.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </CenterCard>
  )
}
