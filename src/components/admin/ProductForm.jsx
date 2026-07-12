'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Upload, X, Loader2 } from 'lucide-react'
import { createProduct, updateProduct, uploadImage } from '@/lib/adminProducts'
import { CATEGORIES } from '@/lib/config'
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
    category: initial?.category || CATEGORIES[0].slug,
    tags: Array.isArray(initial?.tags) ? initial.tags.join(', ') : initial?.tags || '',
    in_stock: initial?.in_stock ?? true,
  })
  const [images, setImages] = useState(Array.isArray(initial?.image_url) ? initial.image_url : [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function onFiles(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const urls = []
      for (const file of files) urls.push(await uploadImage(file))
      setImages((prev) => [...prev, ...urls])
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

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = { ...form, slug: form.slug || slugify(form.name), image_url: images }
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

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select id="category" className="w-full rounded-lg" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="skull, anatomy, medical" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch id="in_stock" checked={form.in_stock} onCheckedChange={(v) => set('in_stock', v)} />
        <Label htmlFor="in_stock">In stock (ready to print)</Label>
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <div className="flex flex-wrap gap-3">
          {images.map((url) => (
            <div key={url} className="relative h-24 w-24 overflow-hidden rounded-xl border border-line">
              <Image src={url} alt="" fill sizes="96px" className="object-cover" />
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
        <p className="text-xs text-stone">First image is the main photo. Compress large images before uploading.</p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving || uploading}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/products')}>Cancel</Button>
      </div>
    </form>
  )
}
