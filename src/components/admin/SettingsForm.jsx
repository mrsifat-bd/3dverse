'use client'
import { useEffect, useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { getSettings, updateSettings, DEFAULT_SETTINGS } from '@/lib/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const FIELDS = [
  { section: 'Business' },
  { k: 'business_name', label: 'Business name' },
  { k: 'owner', label: 'Owner name' },
  { k: 'location', label: 'Location' },
  { k: 'email', label: 'Email', type: 'email' },
  { k: 'phone', label: 'Phone (display)' },
  { k: 'whatsapp_number', label: 'WhatsApp number (digits only, e.g. 8801…)' },
  { k: 'tagline', label: 'Tagline' },
  { k: 'description', label: 'Description', textarea: true },
  { section: 'Home hero' },
  { k: 'hero_headline', label: 'Hero headline' },
  { k: 'hero_subtext', label: 'Hero subtext', textarea: true },
  { section: 'Social links' },
  { k: 'social_facebook', label: 'Facebook URL' },
  { k: 'social_instagram', label: 'Instagram URL' },
  { k: 'social_tiktok', label: 'TikTok URL' },
  { k: 'social_youtube', label: 'YouTube URL' },
  { k: 'social_telegram', label: 'Telegram URL' },
  { section: 'Defaults' },
  { k: 'review_url', label: 'Default review video (bones)' },
]

export default function SettingsForm() {
  const [form, setForm] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSettings().then((s) => { setForm(s); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      await updateSettings(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>

  return (
    <form onSubmit={submit} className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Site settings</h1>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : saved ? (<><Check className="h-4 w-4" /> Saved</>) : 'Save changes'}
        </Button>
      </div>
      <p className="mb-6 text-sm text-stone">Edit the content used across your website. Changes go live right away.</p>

      {error && <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}

      <div className="space-y-5">
        {FIELDS.map((f, i) =>
          f.section ? (
            <h2 key={i} className="border-b border-line pb-2 pt-2 font-display text-lg font-semibold text-ink">{f.section}</h2>
          ) : (
            <div key={f.k} className="space-y-1.5">
              <Label htmlFor={f.k}>{f.label}</Label>
              {f.textarea ? (
                <Textarea id={f.k} value={form[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} rows={3} />
              ) : (
                <Input id={f.k} type={f.type || 'text'} value={form[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />
              )}
            </div>
          )
        )}
      </div>

      <div className="mt-8">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </div>
    </form>
  )
}
