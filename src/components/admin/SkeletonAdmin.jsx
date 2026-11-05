'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Check, ExternalLink, Loader2, Lock, Save } from 'lucide-react'
import { getAdminSkeleton, updateItemMeta, updateBundleMeta, setPrice, setBundleItem, getChangeLog, catalogWarnings } from '@/lib/skeleton/admin'
import { SECTIONS } from '@/lib/skeleton/catalog'
import { indexCatalog, setSaving } from '@/lib/skeleton/pricing'
import { formatPrice } from '@/lib/format'
import { Input } from '@/components/ui/input'

export default function SkeletonAdmin() {
  const [cat, setCat] = useState(null)
  const [error, setError] = useState('')
  const [log, setLog] = useState([])
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState('')
  const [priceEdit, setPriceEdit] = useState(null) // { what, key, half, full, reason }
  const [setEdit, setSetEdit] = useState(null) // { bundle, item, include, mode, qty, reason }

  async function load() {
    setError('')
    try { setCat(await getAdminSkeleton()); setLog(await getChangeLog()) } catch (e) { setError(e.message); setCat({ items: [], bundles: [] }) }
  }
  useEffect(() => { load() }, [])

  const idx = useMemo(() => (cat ? indexCatalog(cat) : null), [cat])
  const warnings = useMemo(() => (cat?.items?.length ? catalogWarnings(cat) : []), [cat])

  async function run(id, fn, ok) {
    setBusy(id); setMsg(''); setError('')
    try { await fn(); setMsg(ok); await load() } catch (e) { setError(e.message) } finally { setBusy(null) }
  }

  if (!cat) return <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Skeleton Builder</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone">Bones, sets and 3D mapping for the 3D Skeleton Builder. Prices and set contents are protected: they change only through “Change price” / “Edit set”, which ask for a reason and are logged. Orders keep their own price snapshot.</p>
        </div>
        <Link href="/skeleton-builder" target="_blank" className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-clay/40"><ExternalLink className="h-4 w-4" /> Open builder</Link>
      </div>
      {error && <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {msg && <p className="mb-4 rounded-xl border border-[#5B8A5B]/30 bg-[#5B8A5B]/10 p-3 text-sm text-ink"><Check className="mr-1 inline h-4 w-4" />{msg}</p>}
      {warnings.length > 0 && (
        <div className="mb-4 rounded-xl border border-[#C99A4E]/40 bg-[#C99A4E]/10 p-3 text-sm text-ink">
          <p className="font-medium"><AlertTriangle className="mr-1 inline h-4 w-4 text-[#C99A4E]" />Price checks</p>
          <ul className="mt-1 list-disc pl-5 text-xs text-stone">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}

      {/* Sets */}
      <div className="grid gap-4 lg:grid-cols-2">
        {cat.bundles.map((b) => (
          <div key={b.key} className="rounded-2xl border border-line bg-paper p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold text-ink">{b.name_en}</p>
                <p className="text-xs text-stone">{b.name_bn} · weight {b.weight_kg} kg · {b.items.length} entries</p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-semibold text-ink">{formatPrice(b.price)}</p>
                <p className="text-[11px] text-stone">Saves {formatPrice(setSaving(idx, b))} vs bones</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs text-ink hover:border-clay/40" onClick={() => setPriceEdit({ what: 'bundle', key: b.key, half: b.price, full: null, reason: '', label: b.name_en })}><Lock className="h-3.5 w-3.5" /> Change price</button>
              <label className="inline-flex items-center gap-1.5 text-xs text-stone">
                <input type="checkbox" checked={b.is_active} disabled={busy === b.key} onChange={(e) => run(b.key, () => updateBundleMeta(b.key, { is_active: e.target.checked }), 'Set updated.')} /> Active
              </label>
            </div>
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-ink">Included bones</summary>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-stone">
                {b.items.map((bi) => (
                  <li key={bi.item_key} className="flex items-center justify-between gap-2">
                    <span>{idx.items[bi.item_key]?.name_en || bi.item_key}{bi.qty > 1 ? ` ×${bi.qty}` : ''} <span className="text-[10px] uppercase">{bi.mode}</span></span>
                    <button type="button" className="text-[10px] text-stone hover:text-destructive" onClick={() => setSetEdit({ bundle: b.key, item: bi.item_key, include: false, mode: bi.mode, qty: bi.qty, reason: '' })}>remove</button>
                  </li>
                ))}
              </ul>
              <button type="button" className="mt-2 text-[11px] text-clay hover:underline" onClick={() => setSetEdit({ bundle: b.key, item: '', include: true, mode: 'single', qty: 1, reason: '' })}>+ Add a bone to this set</button>
            </details>
          </div>
        ))}
      </div>

      {/* Bones */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b border-line bg-cream/60 text-left text-[11px] uppercase tracking-wide text-stone">
            <tr><th className="px-3 py-2">Bone</th><th className="px-3 py-2">Bangla name</th><th className="px-3 py-2">Type</th><th className="px-3 py-2 text-right">One side / single</th><th className="px-3 py-2 text-right">Pair</th><th className="px-3 py-2">3D objects</th><th className="px-3 py-2">Active</th><th className="px-3 py-2">Available</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {SECTIONS.map((s) => (
              <SectionRows key={s.key} section={s} items={cat.items.filter((i) => i.section === s.key)} busy={busy}
                onSave={(key, patch) => run(key, () => updateItemMeta(key, patch), 'Bone updated.')}
                onPrice={(i) => setPriceEdit({ what: 'item', key: i.key, half: i.half_price, full: i.full_price, reason: '', label: i.name_en, paired: i.kind === 'paired' })} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Change log */}
      <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
        <p className="font-display font-semibold text-ink">Change log</p>
        {!log.length ? <p className="mt-2 text-sm text-stone">No price or set changes yet.</p> : (
          <ul className="mt-2 space-y-1 text-xs text-stone">
            {log.map((l) => <li key={l.id}><span className="text-ink">{new Date(l.changed_at).toLocaleString('en-GB')}</span> · {l.actor} · {l.what} · {JSON.stringify(l.old_value)} → {JSON.stringify(l.new_value)} · “{l.reason}”</li>)}
          </ul>
        )}
      </div>

      {priceEdit && (
        <Dialog title={`Change price — ${priceEdit.label}`} onClose={() => setPriceEdit(null)}>
          <p className="text-xs text-stone">Approved prices are protected. This change is logged with your email and reason. Existing orders are not affected.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs text-stone">{priceEdit.what === 'bundle' ? 'Set price ৳' : priceEdit.paired ? 'One side ৳' : 'Price ৳'}<Input className="mt-1" inputMode="numeric" value={priceEdit.half} onChange={(e) => setPriceEdit((p) => ({ ...p, half: e.target.value.replace(/[^0-9]/g, '') }))} /></label>
            {priceEdit.what === 'item' && <label className="text-xs text-stone">{priceEdit.paired ? 'Pair ৳' : 'Second price ৳ (unused)'}<Input className="mt-1" inputMode="numeric" value={priceEdit.full ?? ''} onChange={(e) => setPriceEdit((p) => ({ ...p, full: e.target.value.replace(/[^0-9]/g, '') }))} /></label>}
          </div>
          <label className="mt-3 block text-xs text-stone">Reason (required)<Input className="mt-1" value={priceEdit.reason} onChange={(e) => setPriceEdit((p) => ({ ...p, reason: e.target.value }))} placeholder="e.g. New filament price, approved by owner" /></label>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn-ghost text-sm" onClick={() => setPriceEdit(null)}>Cancel</button>
            <button type="button" className="btn-primary text-sm" disabled={!priceEdit.reason.trim() || busy === 'price'}
              onClick={() => run('price', () => setPrice(priceEdit.what, priceEdit.key, Number(priceEdit.half), priceEdit.full === '' || priceEdit.full === null ? null : Number(priceEdit.full), priceEdit.reason.trim()), 'Price changed and logged.').then(() => setPriceEdit(null))}>
              <Save className="h-4 w-4" /> Save price
            </button>
          </div>
        </Dialog>
      )}
      {setEdit && (
        <Dialog title={setEdit.include ? 'Add a bone to the set' : 'Remove a bone from the set'} onClose={() => setSetEdit(null)}>
          <p className="text-xs text-stone">Set contents are protected and every change is logged. The set price does not change by itself.</p>
          {setEdit.include ? (
            <div className="mt-3 grid grid-cols-3 gap-3">
              <label className="col-span-3 text-xs text-stone">Bone
                <select className="mt-1 h-10 w-full rounded-lg border border-line bg-paper px-2 text-sm" value={setEdit.item} onChange={(e) => setSetEdit((p) => ({ ...p, item: e.target.value, mode: idx.items[e.target.value]?.kind === 'paired' ? (p.bundle === 'full' ? 'full' : 'half') : 'single' }))}>
                  <option value="">Choose…</option>
                  {cat.items.filter((i) => i.listed && !cat.bundles.find((b) => b.key === setEdit.bundle).items.some((bi) => bi.item_key === i.key)).map((i) => <option key={i.key} value={i.key}>{i.name_en}</option>)}
                </select>
              </label>
            </div>
          ) : <p className="mt-3 text-sm text-ink">{idx.items[setEdit.item]?.name_en} from the {setEdit.bundle === 'full' ? 'Full' : 'Half'} Set</p>}
          <label className="mt-3 block text-xs text-stone">Reason (required)<Input className="mt-1" value={setEdit.reason} onChange={(e) => setSetEdit((p) => ({ ...p, reason: e.target.value }))} /></label>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn-ghost text-sm" onClick={() => setSetEdit(null)}>Cancel</button>
            <button type="button" className="btn-primary text-sm" disabled={!setEdit.reason.trim() || !setEdit.item || busy === 'set'}
              onClick={() => run('set', () => setBundleItem(setEdit.bundle, setEdit.item, setEdit.include, setEdit.mode, setEdit.qty, setEdit.reason.trim()), 'Set contents changed and logged.').then(() => setSetEdit(null))}>
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

function SectionRows({ section, items, busy, onSave, onPrice }) {
  return (
    <>
      <tr><td colSpan={9} className="bg-cream/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-clay">{section.name_en}</td></tr>
      {items.map((i) => <ItemRow key={i.key} item={i} busy={busy === i.key} onSave={onSave} onPrice={onPrice} />)}
    </>
  )
}

function ItemRow({ item, busy, onSave, onPrice }) {
  const [d, setD] = useState({ name_en: item.name_en, name_bn: item.name_bn })
  useEffect(() => { setD({ name_en: item.name_en, name_bn: item.name_bn }) }, [item.name_en, item.name_bn])
  const dirty = d.name_en !== item.name_en || d.name_bn !== item.name_bn
  const meshes = Object.entries(item.meshes || {}).map(([s, n]) => `${s}: ${n.join(', ')}`).join(' · ')
  return (
    <tr className="border-t border-line align-top">
      <td className="px-3 py-2"><Input className="h-8 text-sm" value={d.name_en} onChange={(e) => setD((x) => ({ ...x, name_en: e.target.value }))} /><p className="mt-0.5 text-[10px] text-stone">{item.key}{item.listed ? '' : ' · inside sets only'}</p></td>
      <td className="px-3 py-2"><Input className="h-8 font-bangla text-sm" value={d.name_bn} onChange={(e) => setD((x) => ({ ...x, name_bn: e.target.value }))} /></td>
      <td className="px-3 py-2 text-xs text-stone">{item.kind === 'paired' ? 'Left / Right' : item.kind === 'grouped' ? 'Assembled' : item.kind === 'pool' ? 'Any of L1–L5' : 'Midline'}</td>
      <td className="px-3 py-2 text-right text-ink">{formatPrice(item.half_price)}</td>
      <td className="px-3 py-2 text-right text-ink">{item.kind === 'paired' ? formatPrice(item.full_price) : '—'}</td>
      <td className="max-w-[220px] px-3 py-2 text-[11px] text-stone">{meshes}</td>
      <td className="px-3 py-2"><input type="checkbox" aria-label={`${item.name_en} active`} checked={item.is_active} disabled={busy} onChange={(e) => onSave(item.key, { is_active: e.target.checked })} /></td>
      <td className="px-3 py-2"><input type="checkbox" aria-label={`${item.name_en} available`} checked={item.is_available} disabled={busy} onChange={(e) => onSave(item.key, { is_available: e.target.checked })} /></td>
      <td className="whitespace-nowrap px-3 py-2 text-right">
        {dirty && <button type="button" className="mr-2 text-xs font-medium text-clay hover:underline" disabled={busy} onClick={() => onSave(item.key, d)}>Save</button>}
        <button type="button" className="inline-flex items-center gap-1 text-xs text-stone hover:text-clay" onClick={() => onPrice(item)}><Lock className="h-3 w-3" /> Price</button>
      </td>
    </tr>
  )
}

function Dialog({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-line bg-paper p-6 shadow-xl">
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  )
}
