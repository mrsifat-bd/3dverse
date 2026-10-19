'use client'
import { useState } from 'react'
import { Paperclip, Send, Check } from 'lucide-react'
import { IconWhatsapp } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useT } from '@/i18n/client'

const INQUIRY_TYPES = ['printing', 'design', 'medical', 'bulk', 'personalised', 'other']

// No generic inquiry backend exists, so the form composes a structured WhatsApp
// message and opens the official chat (honest fallback — nothing is faked).
export default function ContactInquiryForm({ whatsappNumber }) {
  const t = useT()
  const [form, setForm] = useState({
    name: '', whatsapp: '', type: 'printing', project: '', quantity: '', colour: '', message: '',
  })
  const [fileName, setFileName] = useState('')
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function validate() {
    const e = {}
    if (form.name.trim().length < 2) e.name = t('form.nameRequired')
    if (!/^01\d{9}$/.test(form.whatsapp.replace(/[\s-]/g, ''))) e.whatsapp = t('form.phoneInvalid')
    if (!form.type) e.type = t('inquiry.typeRequired')
    if (form.message.trim().length < 5) e.message = t('inquiry.messageShort')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    // Written in the visitor's language; the team reads both.
    const lines = [
      t('inquiry.msgHello'),
      t('inquiry.msgIntro'),
      '',
      `${t('inquiry.msgName')}: ${form.name.trim()}`,
      `WhatsApp: ${form.whatsapp.trim()}`,
      `${t('inquiry.type')}: ${t(`inquiry.types.${form.type}`)}`,
      `${t('inquiry.project')}: ${form.project.trim() || '—'}`,
      `${t('inquiry.quantity')}: ${form.quantity.trim() || '—'}`,
      `${t('inquiry.colour')}: ${form.colour.trim() || '—'}`,
      '',
      `${t('inquiry.msgDetails')}:`,
      form.message.trim(),
      fileName ? `\n(${t('inquiry.msgFile')}: ${fileName})` : '',
    ]
    const text = encodeURIComponent(lines.filter((l) => l !== undefined).join('\n'))
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank', 'noopener,noreferrer')
    setSent(true)
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label={t('form.fullName')} required error={errors.name}>
          <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" aria-invalid={!!errors.name} />
        </Field>
        <Field id="whatsapp" label={t('inquiry.whatsapp')} required error={errors.whatsapp}>
          <Input id="whatsapp" inputMode="numeric" placeholder="01712345678" value={form.whatsapp}
            onChange={(e) => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))} aria-invalid={!!errors.whatsapp} />
        </Field>
        <Field id="type" label={t('inquiry.type')} required error={errors.type}>
          <Select id="type" value={form.type} onChange={(e) => set('type', e.target.value)} className="w-full">
            {INQUIRY_TYPES.map((k) => <option key={k} value={k}>{t(`inquiry.types.${k}`)}</option>)}
          </Select>
        </Field>
        <Field id="project" label={t('inquiry.project')} hint={t('common.optional')}>
          <Input id="project" value={form.project} onChange={(e) => set('project', e.target.value)} placeholder={t('inquiry.projectPh')} />
        </Field>
        <Field id="quantity" label={t('inquiry.quantity')} hint={t('common.optional')}>
          <Input id="quantity" inputMode="numeric" value={form.quantity} onChange={(e) => set('quantity', e.target.value.replace(/[^0-9]/g, ''))} placeholder={t('inquiry.quantityPh')} />
        </Field>
        <Field id="colour" label={t('inquiry.colour')} hint={t('common.optional')}>
          <Input id="colour" value={form.colour} onChange={(e) => set('colour', e.target.value)} placeholder={t('inquiry.colourPh')} />
        </Field>
      </div>

      <div className="mt-5">
        <Field id="message" label={t('inquiry.message')} required error={errors.message}>
          <Textarea id="message" rows={4} value={form.message} onChange={(e) => set('message', e.target.value)}
            placeholder={t('inquiry.messagePh')} aria-invalid={!!errors.message} />
        </Field>
      </div>

      {/* Reference file — honest handling: no upload backend yet. */}
      <div className="mt-5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-stone">{t('inquiry.file')} <span className="font-normal normal-case text-stone/70">({t('common.optional')})</span></Label>
        <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-cream/40 px-4 py-3 text-sm text-stone transition-colors hover:border-clay/40">
          <Paperclip className="h-4 w-4 shrink-0 text-clay" />
          <span className="min-w-0 flex-1 truncate">{fileName || t('inquiry.filePick')}</span>
          <input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
        </label>
        <p className="mt-1.5 text-xs text-stone">
          {t('inquiry.fileHint')}
        </p>
      </div>

      <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Button type="submit" className="w-full sm:w-auto">
          <IconWhatsapp className="h-4 w-4" /> {t('inquiry.send')}
        </Button>
        {sent && (
          <span role="status" className="enter inline-flex items-center gap-1.5 text-sm text-clay">
            <Check className="h-4 w-4" /> {t('inquiry.sent')}
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-stone">
        {t('inquiry.privacy')}
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
      {error && <p role="alert" className="enter text-xs text-destructive">{error}</p>}
    </div>
  )
}
