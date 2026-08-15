'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, User, Package, Heart, MessageSquare, Settings, LogOut } from 'lucide-react'
import { Camera, Loader2 as Spinner } from 'lucide-react'
import { useAuth, signOut } from '@/hooks/useAuth'
import { getMyProfile, updateMyProfile, uploadAvatar } from '@/lib/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const LINKS = [
  { href: '/account', label: 'Profile', Icon: User },
  { href: '/account/orders', label: 'My Orders', Icon: Package },
  { href: '/account/wishlist', label: 'Wishlist', Icon: Heart },
]

export default function AccountPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone: '', default_address: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/account')
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return
    getMyProfile().then(({ profile }) => {
      setProfile(profile)
      setAvatarUrl(profile?.avatar_url || '')
      setForm({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        default_address: profile?.default_address || '',
      })
    })
  }, [user])

  async function onAvatarChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingAvatar(true); setError('')
    try {
      const url = await uploadAvatar(file)
      setAvatarUrl(url)
    } catch (err) { setError(err.message) } finally { setUploadingAvatar(false) }
  }

  const initials = (form.full_name || user?.email || '?').trim().slice(0, 2).toUpperCase()

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function save(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      await updateMyProfile(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  if (loading || !user) {
    return <div className="container flex items-center gap-2 py-24 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
  }

  return (
    <div className="container py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">My Account</h1>
      <p className="mt-1 text-sm text-stone">{user.email}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-line bg-paper p-4 md:sticky md:top-24">
          <nav className="space-y-1.5">
            {LINKS.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink/80 transition-all duration-200 hover:translate-x-0.5 hover:bg-line/50">
                <Icon className="h-4 w-4 shrink-0" /> {label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 space-y-1.5 border-t border-line pt-4">
            <Link href="/reset-password" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink/80 transition-all duration-200 hover:translate-x-0.5 hover:bg-line/50">
              <Settings className="h-4 w-4 shrink-0" /> Change password
            </Link>
            <button onClick={() => { signOut().then(() => router.push('/')) }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink/80 transition-all duration-200 hover:translate-x-0.5 hover:bg-line/50">
              <LogOut className="h-4 w-4 shrink-0" /> Sign out
            </button>
          </div>
        </aside>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Profile</h2>

          {/* Avatar */}
          <div className="mt-5 flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-line bg-cream">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Your photo" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center font-display text-xl font-semibold text-clay">{initials}</span>
              )}
              {uploadingAvatar && (
                <span className="absolute inset-0 grid place-items-center bg-ink/50"><Spinner className="h-5 w-5 animate-spin text-paper" /></span>
              )}
            </div>
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-clay/40 hover:text-clay">
                <Camera className="h-4 w-4" /> {avatarUrl ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} disabled={uploadingAvatar} />
              </label>
              <p className="mt-1.5 text-xs text-stone">JPG or PNG, up to 5 MB.</p>
            </div>
          </div>

          <form onSubmit={save} className="mt-6 max-w-md space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr">Default delivery address</Label>
              <Textarea id="addr" rows={3} value={form.default_address} onChange={(e) => set('default_address', e.target.value)} placeholder="House / road, area, thana, district" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
              {saved && <span className="text-sm text-clay">Saved ✓</span>}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
