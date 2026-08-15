'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, Trash2, Plus, Loader2, Tags } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { listProducts, deleteProduct } from '@/lib/adminProducts'
import { formatPrice, firstImage } from '@/lib/format'
import { categoryName, CATEGORIES } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export default function ProductTable() {
  const [products, setProducts] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('all')
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    try {
      setProducts(await listProducts())
    } catch (err) {
      setError(err.message)
      setProducts([])
    }
  }
  useEffect(() => { load() }, [])

  async function onDelete(id) {
    setDeleting(true)
    try {
      await deleteProduct(id)
      setConfirmId(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const visible = (products || []).filter((p) => {
    if (category !== 'all' && p.category !== category) return false
    const s = q.trim().toLowerCase()
    if (!s) return true
    return (
      p.name.toLowerCase().includes(s) ||
      (p.category || '').toLowerCase().includes(s) ||
      categoryName(p.category).toLowerCase().includes(s)
    )
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">Products</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/admin/categories"><Tags className="h-4 w-4" /> Categories</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products/new"><Plus className="h-4 w-4" /> New product</Link>
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-xs">
          <Input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" className="w-full sm:w-auto">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Select>
        <span className="text-sm text-stone sm:ml-auto">{visible.length} shown</span>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {products === null ? (
        <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper py-16 text-center text-sm text-stone">
          No products yet. Create your first one.
        </div>
      ) : (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-x-auto rounded-2xl border border-line"
        >
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-stone">
              <tr>
                <th className="p-3 font-medium">Product</th>
                <th className="hidden p-3 font-medium sm:table-cell">Category</th>
                <th className="p-3 font-medium">Price</th>
                <th className="hidden p-3 font-medium md:table-cell">Cost 🔒</th>
                <th className="hidden p-3 font-medium sm:table-cell">Stock</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-t border-line transition-colors hover:bg-line/40">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-line/40">
                        {firstImage(p) && <Image src={firstImage(p)} alt="" fill sizes="44px" className="object-cover" />}
                      </div>
                      <span className="font-medium text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="hidden p-3 text-stone sm:table-cell">{categoryName(p.category)}</td>
                  <td className="p-3 text-ink">{formatPrice(p.price)}</td>
                  <td className="hidden p-3 text-stone md:table-cell">{p.production_cost != null && p.production_cost !== '' ? formatPrice(p.production_cost) : '—'}</td>
                  <td className="hidden p-3 sm:table-cell">
                    {p.in_stock ? <Badge>In stock</Badge> : <Badge variant="muted">Made to order</Badge>}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="icon"><Link href={`/admin/products/${p.id}`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                      <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setConfirmId(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <AnimatePresence>
        {confirmId && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => !deleting && setConfirmId(null)}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-display text-lg font-semibold text-ink">Delete this product?</h2>
              <p className="mt-2 text-sm text-stone">This cannot be undone.</p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setConfirmId(null)} disabled={deleting}>Cancel</Button>
                <Button variant="destructive" onClick={() => onDelete(confirmId)} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
