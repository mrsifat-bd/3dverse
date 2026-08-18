'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Upload, X, Loader2, Plus } from 'lucide-react'
import { createProduct, updateProduct, uploadImage } from '@/lib/adminProducts'
import { CATEGORIES as FALLBACK_CATEGORIES } from '@/lib/config'
import { getAllCategories } from '@/lib/categories'
import { slugify } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export default function ProductForm({ initial }) {
  const router = useRouter()
  const editing = Boolean(initial?.id)

  const [form, setForm] = useState({
    name: initial?.name || '',
    slug: initial?.slug || '',
    price: initial?.price ?? '',
    description: initial?.description || '',
    category: initial?.category || FALLBACK_CATEGORIES[0].slug,
    tags: Array.isArray(initial?.tags) ? initial.tags.join(', ') : initial?.tags || '',
    in_stock: initial?.in_stock ?? true,
    is_popular: initial?.is_popular ?? false,
    weight_kg: initial?.weight_kg ?? 0.5,
    discount_percent: initial?.discount_percent ?? 0,
    production_cost: initial?.production_cost ?? '',
    review_url: initial?.review_url || '',
    extra_link: initial?.extra_link || '',
    extra_link_label: initial?.extra_link_label || '',
    model_source_url: initial?.model_source_url || '',
  })
  const [images, setImages] = useState(Array.isArray(initial?.image_url) ? initial.image_url : [])
  const [faqs, setFaqs] = useState(Array.isArray(initial?.faqs) ? initial.faqs : [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES)

  // Admin form: load ALL categories (incl. brand-new empty ones) so a product
  // can be assigned to a category right after it's created. Falls back to config.
  useEffect(() => { getAllCategories().then((c) => { if (Array.isArray(c) && c.length) setCategories(c) }).catch(() => {}) }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function onFiles(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const urls = []
      for (const file of files) urls.push(await uploadImage(file))
      // New uploads go to the FRONT so the latest photo becomes the main
      // (card) image right away. Use "Set main" to change it afterwards.
      setImages((prev) => [...urls, ...prev])
    } catch (err) {
      setError(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removeImage(url) {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  // Move an image to the front so it becomes the main (card) photo.
  function makeMain(url) {
    setImages((prev) => [url, ...prev.filter((u) => u !== url)])
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = { ...form, slug: form.slug || slugify(form.name), image_url: images, faqs }
    try {
      if (editing) await updateProduct(initial.id, payload)
      else await createProduct(payload)
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setError(err.message || 'Save failed')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required
          onBlur={() => { if (!form.slug) set('slug', slugify(form.name)) }} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input id="slug" value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} placeholder="auto from name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (৳)</Label>
          <Input id="price" type="number" min="0" step="1" value={form.price} onChange={(e) => set('price', e.target.value)} required />
        </div>
      </div>

      <div className="space-y-1.5 rounded-xl border border-dashed border-line bg-line/20 p-3">
        <Label htmlFor="production_cost">Production cost (৳) — private 🔒</Label>
        <Input id="production_cost" type="number" min="0" step="0.01" value={form.production_cost} onChange={(e) => set('production_cost', e.target.value)} placeholder="Your internal cost" />
        <p className="text-xs text-stone">Internal only — never shown on the website or sent to any visitor. For your own reference when orders come in.</p>
      </div>

      <div className="space-y-1.5 rounded-xl border border-dashed border-line bg-line/20 p-3">
        <Label htmlFor="model_source_url">3D model link — private 🔒</Label>
        <Input id="model_source_url" type="url" value={form.model_source_url} onChange={(e) => set('model_source_url', e.target.value)} placeholder="https://… link to the source 3D model file" />
        {form.model_source_url?.trim() && (
          <a href={form.model_source_url.trim()} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-clay hover:underline">
            Open / download model ↗
          </a>
        )}
        <p className="text-xs text-stone">Internal only — the link to where you got this 3D model, so you can open it later to download and print. Never shown anywhere on the website or to any visitor.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select id="category" className="w-full rounded-lg" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weight_kg">Weight (kg)</Label>
          <Input id="weight_kg" type="number" min="0" step="0.05" value={form.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} placeholder="0.5" />
          <p className="text-xs text-stone">Used to calculate the delivery charge at checkout.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="skull, anatomy, medical" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <Switch id="in_stock" checked={form.in_stock} onCheckedChange={(v) => set('in_stock', v)} />
          <Label htmlFor="in_stock">In stock (ready to print)</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="is_popular" checked={form.is_popular} onCheckedChange={(v) => set('is_popular', v)} />
          <Label htmlFor="is_popular">Mark as popular (shows first)</Label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="discount_percent">Discount (% off)</Label>
          <Input id="discount_percent" type="number" min="0" max="99" step="1" value={form.discount_percent} onChange={(e) => set('discount_percent', e.target.value)} placeholder="0" />
          <p className="text-xs text-stone">Leave 0 for no discount. e.g. 20 = 20% off.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review_url">Review video link (YouTube)</Label>
          <Input id="review_url" type="url" value={form.review_url} onChange={(e) => set('review_url', e.target.value)} placeholder="https://youtube.com/watch?v=…" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="extra_link">Custom link (URL)</Label>
          <Input id="extra_link" type="url" value={form.extra_link} onChange={(e) => set('extra_link', e.target.value)} placeholder="https://…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="extra_link_label">Custom link label</Label>
          <Input id="extra_link_label" value={form.extra_link_label} onChange={(e) => set('extra_link_label', e.target.value)} placeholder="e.g. See 3D model" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <div className="flex flex-wrap gap-3">
          {images.map((url, idx) => (
            <div key={url} className={`relative h-24 w-24 overflow-hidden rounded-xl border ${idx === 0 ? 'border-clay ring-2 ring-clay/40' : 'border-line'}`}>
              <Image src={url} alt="" fill sizes="96px" className="object-cover" />
              {idx === 0 ? (
                <span className="absolute left-1 top-1 rounded-full bg-clay px-1.5 py-0.5 text-[10px] font-medium text-paper">Main</span>
              ) : (
                <button type="button" onClick={() => makeMain(url)} aria-label="Set as main photo"
                  className="absolute left-1 top-1 rounded-full bg-ink/80 px-1.5 py-0.5 text-[10px] font-medium text-paper hover:bg-clay">
                  Set main
                </button>
              )}
              <button type="button" onClick={() => removeImage(url)} aria-label="Remove image"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-paper">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-xl border border-dashed border-line text-stone hover:border-clay/50 hover:text-clay">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
          </label>
        </div>
        <p className="text-xs text-stone">The image marked <span className="font-medium text-clay">Main</span> is what shows on product cards. New uploads become the Main photo automatically — or click <span className="font-medium">Set main</span> on any image. Compress large images before uploading.</p>
      </div>

      <div className="space-y-3 border-t border-line pt-6">
        <div className="flex items-center justify-between">
          <Label>FAQs (collapsible section on the product page)</Label>
          <Button type="button" variant="ghost" size="sm" onClick={() => setFaqs((p) => [...p, { q: '', a: '' }])}>
            <Plus className="h-4 w-4" /> Add FAQ
          </Button>
        </div>
        {faqs.length === 0 && (
          <p className="text-xs text-stone">No FAQs yet. Add question/answer pairs — only the questions show, and they expand on click.</p>
        )}
        {faqs.map((f, idx) => (
          <div key={idx} className="space-y-2 rounded-xl border border-line p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Question (headline)"
                value={f.q}
                onChange={(e) => setFaqs((p) => p.map((x, i) => (i === idx ? { ...x, q: e.target.value } : x)))}
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove FAQ" onClick={() => setFaqs((p) => p.filter((_, i) => i !== idx))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              placeholder="Answer"
              rows={2}
              value={f.a}
              onChange={(e) => setFaqs((p) => p.map((x, i) => (i === idx ? { ...x, a: e.target.value } : x)))}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving || uploading}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/products')}>Cancel</Button>
      </div>
    </form>
  )
}
