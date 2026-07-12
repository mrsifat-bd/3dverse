'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { listProducts, deleteProduct } from '@/lib/adminProducts'
import { formatPrice, firstImage } from '@/lib/format'
import { categoryName } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default function ProductTable() {
  const [products, setProducts] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
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

  const visible = (products || []).filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()) || p.category.includes(q.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new"><Plus className="h-4 w-4" /> New product</Link>
        </Button>
      </div>

      <div className="mb-4 max-w-xs">
        <Input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {products === null ? (
        <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper py-16 text-center text-sm text-stone">
          No products yet. Create your first one.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-stone">
              <tr>
                <th className="p-3 font-medium">Product</th>
                <th className="hidden p-3 font-medium sm:table-cell">Category</th>
                <th className="p-3 font-medium">Price</th>
                <th className="hidden p-3 font-medium sm:table-cell">Stock</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-t border-line">
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
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Delete this product?</h2>
            <p className="mt-2 text-sm text-stone">This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmId(null)} disabled={deleting}>Cancel</Button>
              <Button variant="destructive" onClick={() => onDelete(confirmId)} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
