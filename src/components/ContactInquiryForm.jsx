'use client'
import { useState } from 'react'
import { Paperclip, Send, Check } from 'lucide-react'
import { IconWhatsapp } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const INQUIRY_TYPES = [
  'Custom 3D Printing',
  'Custom 3D Design',
  'Medical / Anatomy Model',
  'Bulk / Business Order',
  'Personalised Product',
  'Other',
]

// No generic inquiry backend exists, so the form composes a structured WhatsApp
// message and opens the official chat (honest fallback — nothing is faked).
export default function ContactInquiryForm({ whatsappNumber }) {
  const [form, setForm] = useState({
    name: '', whatsapp: '', type: 'Custom 3D Printing', project: '', quantity: '', colour: '', message: '',
  })
  const [fileName, setFileName] = useState('')
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function validate() {
    const e = {}
    if (form.name.trim().length < 2) e.name = 'Please enter your name.'
    if (!/^01\d{9}$/.test(form.whatsapp.replace(/[\s-]/g, ''))) e.whatsapp = 'Enter a valid 11-digit number (e.g. 01712345678).'
    if (!form.type) e.type = 'Choose an inquiry type.'
    if (form.message.trim().length < 5) e.message = 'Tell us a little about what you need.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const lines = [
      'Hello 3D Verse,',
      "I'd like to make an inquiry.",
      '',
      `Name: ${form.name.trim()}`,
      `WhatsApp: ${form.whatsapp.trim()}`,
      `Inquiry type: ${form.type}`,
      `Project/Product: ${form.project.trim() || '—'}`,
      `Quantity: ${form.quantity.trim() || '—'}`,
      `Preferred colour: ${form.colour.trim() || '—'}`,
      '',
      'Details:',
      form.message.trim(),
      fileName ? `\n(Reference file to send: ${fileName})` : '',
    ]
    const text = encodeURIComponent(lines.filter((l) => l !== undefined).join('\n'))
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank', 'noopener,noreferrer')
    setSent(true)
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Full name" required error={errors.name}>
          <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" aria-invalid={!!errors.name} />
        </Field>
        <Field id="whatsapp" label="WhatsApp number" required error={errors.whatsapp}>
          <Input id="whatsapp" inputMode="numeric" placeholder="01712345678" value={form.whatsapp}
            onChange={(e) => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))} aria-invalid={!!errors.whatsapp} />
        </Field>
        <Field id="type" label="Inquiry type" required error={errors.type}>
          <Select id="type" value={form.type} onChange={(e) => set('type', e.target.value)} className="w-full">
            {INQUIRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field id="project" label="Project / product name" hint="Optional">
          <Input id="project" value={form.project} onChange={(e) => set('project', e.target.value)} placeholder="e.g. Skull model, keyring…" />
        </Field>
        <Field id="quantity" label="Quantity" hint="Optional">
          <Input id="quantity" inputMode="numeric" value={form.quantity} onChange={(e) => set('quantity', e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g. 10" />
        </Field>
        <Field id="colour" label="Preferred colour" hint="Optional">
          <Input id="colour" value={form.colour} onChange={(e) => set('colour', e.target.value)} placeholder="e.g. Black, white, custom" />
        </Field>
      </div>

      <div className="mt-5">
        <Field id="message" label="Message / description" required error={errors.message}>
          <Textarea id="message" rows={4} value={form.message} onChange={(e) => set('message', e.target.value)}
            placeholder="Describe what you'd like to make — size, material, reference, deadline…" aria-invalid={!!errors.message} />
        </Field>
      </div>

      {/* Reference file — honest handling: no upload backend yet. */}
      <div className="mt-5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-stone">Reference file <span className="font-normal normal-case text-stone/70">(optional)</span></Label>
        <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-cream/40 px-4 py-3 text-sm text-stone transition-colors hover:border-clay/40">
          <Paperclip className="h-4 w-4 shrink-0 text-clay" />
          <span className="min-w-0 flex-1 truncate">{fileName || 'Choose an image or 3D file to reference'}</span>
          <input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
        </label>
        <p className="mt-1.5 text-xs text-stone">
          Uploads aren&apos;t stored here yet — after you tap send, attach the file directly in the WhatsApp chat.
        </p>
      </div>

      <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Button type="submit" className="w-full sm:w-auto">
          <IconWhatsapp className="h-4 w-4" /> Send via WhatsApp
        </Button>
        {sent && (
          <span className="inline-flex items-center gap-1.5 text-sm text-clay">
            <Check className="h-4 w-4" /> WhatsApp opened with your details — press send there.
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-stone">
        Your details are formatted into a WhatsApp message and opened in a new tab. Nothing is stored on this site.
      </p>
    </form>
  )
}

function Field({ id, label, required, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone">
        {label}
        {required ? <span className="text-clay" aria-hidden>*</span> : hint ? <span className="font-normal normal-case text-stone/70">({hint})</span> : null}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
