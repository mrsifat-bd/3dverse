'use client'
import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2, Check } from 'lucide-react'
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '@/lib/categories'
import { slugify } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CategoriesTable() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', slug: '', blurb: '', sort: 0 })
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setError('')
    try { setRows(await getAllCategories()) } catch (e) { setError(e.message); setRows([]) }
  }
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    setError('')
    const name = form.name.trim()
    const slug = (form.slug.trim() || slugify(name))
    if (!name || !slug) { setError('Name is required.'); return }
    setAdding(true)
    try {
      await createCategory({ name, slug, blurb: form.blurb, sort: Number(form.sort) || 0 })
      setForm({ name: '', slug: '', blurb: '', sort: 0 })
      await load()
    } catch (e) { setError(e.message) } finally { setAdding(false) }
  }

  async function patch(cat, changes) {
    setBusyId(cat.id); setError('')
    try {
      await updateCategory(cat.id, changes)
      setRows((p) => p.map((r) => (r.id === cat.id ? { ...r, ...changes } : r)))
    } catch (e) { setError(e.message) } finally { setBusyId(null) }
  }

  async function remove(cat) {
    if (!window.confirm(`Delete category "${cat.name}"? Products keep their existing category tag; they just won't be grouped under this until reassigned.`)) return
    setBusyId(cat.id); setError('')
    try { await deleteCategory(cat.id); setRows((p) => p.filter((r) => r.id !== cat.id)) }
    catch (e) { setError(e.message) } finally { setBusyId(null) }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Categories</h1>
        <p className="mt-1 text-sm text-stone">Add, edit, reorder, activate or deactivate product categories.</p>
      </div>

      {error && <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {/* Add */}
      <form onSubmit={add} className="mb-6 rounded-2xl border border-line bg-paper p-5">
        <p className="font-display text-lg font-semibold text-ink">New category</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="cname">Name</Label><Input id="cname" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} placeholder="e.g. Keyrings" /></div>
          <div className="space-y-1.5"><Label htmlFor="cslug">Slug</Label><Input id="cslug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="keyrings" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="cblurb">Blurb</Label><Input id="cblurb" value={form.blurb} onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))} placeholder="Short description shown on the category card" /></div>
          <div className="space-y-1.5"><Label htmlFor="csort">Sort order</Label><Input id="csort" inputMode="numeric" value={form.sort} onChange={(e) => setForm((f) => ({ ...f, sort: e.target.value.replace(/[^0-9]/g, '') }))} /></div>
        </div>
        <Button type="submit" className="mt-4" disabled={adding}>{adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add category</Button>
      </form>

      {rows === null ? (
        <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper py-16 text-center text-sm text-stone">No categories yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-stone">
              <tr>
                <th className="p-3 font-medium">Name</th>
                <th className="hidden p-3 font-medium sm:table-cell">Slug</th>
                <th className="p-3 font-medium">Sort</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-line transition-colors hover:bg-line/40">
                  <td className="p-3">
                    <input defaultValue={c.name} onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && patch(c, { name: e.target.value.trim() })} className="w-full max-w-[180px] rounded-lg border border-transparent bg-transparent px-2 py-1 font-medium text-ink hover:border-line focus:border-clay/40 focus:outline-none" />
                  </td>
                  <td className="hidden p-3 text-stone sm:table-cell">{c.slug}</td>
                  <td className="p-3">
                    <input defaultValue={c.sort} onBlur={(e) => Number(e.target.value) !== c.sort && patch(c, { sort: Number(e.target.value) || 0 })} inputMode="numeric" className="w-14 rounded-lg border border-line bg-cream px-2 py-1 text-ink focus:outline-none" />
                  </td>
                  <td className="p-3">
                    <button onClick={() => patch(c, { status: c.status === 'active' ? 'inactive' : 'active' })} disabled={busyId === c.id} className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.status === 'active' ? 'bg-clay/10 text-clay' : 'bg-line/60 text-stone'}`}>{c.status === 'active' ? 'Active' : 'Inactive'}</button>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(c)} disabled={busyId === c.id}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-stone"><Check className="mr-1 inline h-3 w-3" /> Edits save when you click away from a field.</p>
    </div>
  )
}
