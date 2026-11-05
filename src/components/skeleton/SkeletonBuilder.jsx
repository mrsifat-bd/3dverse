'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from '@/components/LocalizedLink'
import { useLang, useT } from '@/i18n/client'
import { useCart } from '@/components/CartProvider'
import { formatPrice, formatNumber } from '@/lib/format'
import { quote, indexCatalog, piecesForSet } from '@/lib/skeleton/pricing'
import {
  meshIndex, optionOf, setOption, setQty, applySet, switchAllSides, meshRoles, randomSide, setMembership, countIncluded, unionPieces,
} from '@/lib/skeleton/selection'
import { Check, ChevronDown, Info, Loader2, Minus, Plus, RotateCcw, Search, ShoppingBag, X, ZoomIn, ZoomOut, Layers, Sparkles } from 'lucide-react'

const SkeletonViewer = dynamic(() => import('./SkeletonViewer'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center"><img src="/models/skeleton-front.webp" alt="" className="max-h-[72%] w-auto animate-pulse opacity-40" /></div>,
})

const DRAFT_KEY = '3dv_skeleton_draft'

async function fetchLiveCatalog() {
  try {
    const { supabase } = await import('@/lib/supabaseClient')
    if (!supabase) return null
    const { data, error } = await supabase.rpc('skeleton_catalog')
    if (error || !data?.items?.length) return null
    return {
      items: data.items.map((i) => ({ ...i, half_price: Number(i.half_price), full_price: i.full_price === null ? null : Number(i.full_price), weight_kg: Number(i.weight_kg) })),
      bundles: data.bundles.map((b) => ({ ...b, price: Number(b.price), weight_kg: Number(b.weight_kg) })),
    }
  } catch { return null }
}
// Bangla labels for the bone groups in the list (catalogue keeps English).
const GROUPS_BN = {
  Base: 'বেস', 'Skull Bones': 'খুলির হাড়', 'Vertebrae & Hyoid': 'কশেরুকা ও হাইঅয়েড',
  'Shoulder Girdle': 'শোল্ডার গার্ডল', Arm: 'বাহু', Forearm: 'অগ্রবাহু', Hand: 'হাত',
  'Pelvic Girdle': 'পেলভিক গার্ডল', 'Lumbar Vertebrae': 'লাম্বার কশেরুকা', 'Lower Limb': 'পা',
  'Sternum & Ribs': 'স্টার্নাম ও পাঁজর', 'Thoracic Vertebrae': 'থোরাসিক কশেরুকা',
}
const nm = (o, lang) => (lang === 'bn' && o?.name_bn ? o.name_bn : o?.name_en || '')

function readDraft() {
  try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); return Array.isArray(d?.pieces) ? d.pieces : null } catch { return null }
}
function writeDraft(pieces) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ pieces })) } catch {} }

export default function SkeletonBuilder({ catalog: initialCatalog, sections, live: initialLive }) {
  // If the server could not read the live catalogue, try again from the
  // browser; until it succeeds, Add to cart stays off (never priced from code).
  const [{ catalog, live }, setCat] = useState({ catalog: initialCatalog, live: initialLive })
  useEffect(() => {
    if (initialLive) return
    let on = true
    fetchLiveCatalog().then((c) => { if (on && c) setCat({ catalog: c, live: true }) })
    return () => { on = false }
  }, [initialLive])
  const t = useT()
  const lang = useLang()
  const cart = useCart()
  const money = useCallback((v) => formatPrice(v, lang), [lang])
  const idx = useMemo(() => indexCatalog(catalog), [catalog])
  const meshMap = useMemo(() => meshIndex(catalog), [catalog])
  const listed = useMemo(() => catalog.items.filter((i) => i.listed), [catalog])

  const [pieces, setPieces] = useState([])
  const [mode, setMode] = useState('custom') // which set button was last used
  const [halfSide, setHalfSide] = useState('L')
  const [focus, setFocus] = useState(null)
  const [section, setSection] = useState('all')
  const [q, setQ] = useState('')
  const [view, setView] = useState('front')
  const [viewNonce, setViewNonce] = useState(0)
  const [zoomNonce, setZoomNonce] = useState(null)
  const [pendingSet, setPendingSet] = useState(null)
  const [showIncluded, setShowIncluded] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [load3d, setLoad3d] = useState(true)
  const restored = useRef(false)

  // Restore: the builder line already in the cart, else the unsaved draft.
  useEffect(() => {
    if (restored.current || !cart || cart.loading) return
    restored.current = true
    const fromCart = cart.skeleton?.config?.pieces
    const d = fromCart && fromCart.length ? fromCart : readDraft()
    if (d && d.length) {
      const ok = quote(catalog, { pieces: d })
      if (ok.ok) { setPieces(d); if (ok.set) setMode(ok.set) }
    }
    try { if (navigator.connection?.saveData) setLoad3d(false) } catch {}
  }, [cart, catalog])
  useEffect(() => { if (restored.current) writeDraft(pieces) }, [pieces])

  const qt = useMemo(() => quote(catalog, { pieces }), [catalog, pieces])
  const roles = useMemo(() => meshRoles(catalog, pieces, focus), [catalog, pieces, focus])
  const colorFor = useCallback((mesh) => {
    if (roles[mesh]) return roles[mesh]
    return meshMap[mesh] && idx.items[meshMap[mesh].key]?.is_active ? 'bone' : 'context'
  }, [roles, meshMap, idx])
  const pickable = useCallback((mesh) => Boolean(meshMap[mesh] && idx.items[meshMap[mesh].key]?.is_active), [meshMap, idx])
  const labelFor = useCallback((mesh) => {
    const m = meshMap[mesh]; const it = m && idx.items[m.key]
    if (!it) return ''
    const side = it.kind === 'paired' ? ` · ${m.side === 'L' ? t('builder.left') : t('builder.right')}` : ''
    return `${nm(it, lang)}${side}`
  }, [meshMap, idx, lang, t])

  const announce = useRef(null)
  useEffect(() => { if (announce.current) announce.current.textContent = `${t('builder.total')} ${money(qt.total || 0)}` }, [qt.total, money, t])

  // ---- actions ---------------------------------------------------------------
  const change = (next) => { setPieces(next); setNotice(null) }
  function pickMesh(mesh) {
    const m = meshMap[mesh]; if (!m) return
    const it = idx.items[m.key]
    setFocus(it.key)
    // The assembled pelvis already contains these bones: tapping one only shows
    // its card (adding a loose copy needs a deliberate Add on the card).
    if (['hip', 'sacrum', 'coccyx'].includes(it.key) && pieces.some((p) => p.k === 'pelvis')) return
    if (!optionOf(pieces, it)) change(setOption(pieces, it, it.kind === 'paired' ? m.side : 'S'))
  }
  function choose(it, option) {
    setFocus(it.key)
    change(setOption(pieces, it, option))
  }
  function toggle(it) {
    setFocus(it.key)
    if (optionOf(pieces, it)) change(setOption(pieces, it, null))
    else change(setOption(pieces, it, it.kind === 'paired' ? randomSide() : 'S'))
  }
  function startSet(key) {
    const side = key === 'half' ? randomSide() : 'L'
    if (pieces.length && quote(catalog, { pieces }).set !== key) { setPendingSet({ key, side }); return }
    finishSet(key, side, false)
  }
  function finishSet(key, side, keep) {
    setHalfSide(side); setMode(key); setPendingSet(null); setFocus(null)
    change(applySet(catalog, keep ? pieces : [], key, side, keep))
  }
  function flipHalf(side) { setHalfSide(side); change(switchAllSides(catalog, pieces, side)) }
  function clearAll() { change([]); setMode('custom'); setFocus(null) }
  function goView(v) { setView(v); setViewNonce((n) => n + 1) }

  async function addToCart() {
    if (!cart || !qt.ok || !qt.total) return
    setBusy(true); setNotice(null)
    const r = await cart.setSkeleton({ pieces })
    setBusy(false)
    setNotice(r.ok ? { kind: 'ok', text: t('builder.addedToCart') } : { kind: 'err', text: t('builder.invalidSelection') })
  }

  // ---- derived for the UI ----------------------------------------------------
  const term = q.trim().toLowerCase()
  const visible = listed.filter((i) => (section === 'all' || i.section === section) && (!term || i.name_en.toLowerCase().includes(term) || (i.name_bn || '').includes(q.trim())))
  const focusItem = focus ? idx.items[focus] : null
  const setName = (k) => nm(catalog.bundles.find((b) => b.key === k), lang)
  const inCart = Boolean(cart?.skeleton)

  const nearSet = useMemo(() => {
    if (qt.set || !pieces.length) return null
    for (const key of ['full', 'half']) {
      const b = idx.bundles[key]; if (!b) continue
      const target = unionPieces(pieces, piecesForSet(catalog, key, halfSide))
      const done = quote(catalog, { pieces: target })
      const missing = target.reduce((a, p) => a + (p.q || 1), 0) - pieces.reduce((a, p) => a + (p.q || 1), 0)
      if (done.ok && done.set === key && missing > 0 && missing <= 8 && done.total <= qt.total + 1200) return { key, missing, price: done.total, target }
    }
    return null
  }, [qt, pieces, idx, catalog, halfSide])

  const extras = (qt.lines || []).filter((l) => l.type === 'extra')
  const included = (qt.lines || []).filter((l) => l.type === 'included')
  const setLine = (qt.lines || []).find((l) => l.type === 'set')
  const sideLabel = (s) => (s === 'L' ? t('builder.left') : s === 'R' ? t('builder.right') : '')

  const renderSummary = (compact = false) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">{t('builder.summary')}</h2>
        {pieces.length > 0 && <button type="button" onClick={clearAll} className="text-xs text-stone hover:text-clay">{t('builder.clearAll')}</button>}
      </div>
      {!pieces.length ? (
        <p className="mt-4 text-sm leading-relaxed text-stone">{t('builder.empty')}</p>
      ) : (
        <div className={`mt-3 space-y-3 text-sm ${compact ? '' : 'sk-scroll max-h-[46vh] overflow-y-auto pr-1'}`}>
          {setLine && (
            <div className="rounded-xl border border-clay/30 bg-clay/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-ink"><Layers className="mr-1.5 inline h-4 w-4 text-clay" />{nm(setLine, lang)}</span>
                <span className="font-semibold text-ink">{money(setLine.amount)}</span>
              </div>
              <button type="button" onClick={() => setShowIncluded((v) => !v)} className="mt-1.5 inline-flex items-center gap-1 text-xs text-clay hover:underline" aria-expanded={showIncluded}>
                {showIncluded ? t('builder.hideIncluded') : t('builder.showIncluded')} ({formatNumber(included.reduce((a, l) => a + l.qty, 0), lang)})
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showIncluded ? 'rotate-180' : ''}`} />
              </button>
              {showIncluded && (
                <ul className="mt-2 grid grid-cols-1 gap-x-3 gap-y-0.5 text-xs text-stone sm:grid-cols-2">
                  {included.map((l) => <li key={`${l.key}${l.side}`}>{nm(l, lang)}{l.side !== 'S' ? ` · ${sideLabel(l.side)}` : ''}{l.qty > 1 ? ` ×${formatNumber(l.qty, lang)}` : ''}</li>)}
                </ul>
              )}
            </div>
          )}
          {extras.length > 0 && (
            <div>
              {setLine && <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone">{t('builder.extras')}</p>}
              <ul className="space-y-1.5">
                {extras.map((l) => {
                  const it = idx.items[l.key]
                  return (
                    <li key={`${l.key}${l.side}`} className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-2">
                      <button type="button" onClick={() => setFocus(l.key)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate font-medium text-ink">{nm(l, lang)}</span>
                        <span className="block text-xs text-stone">{it?.kind === 'paired' ? sideLabel(l.side) : it?.kind === 'grouped' ? t('builder.assembled') : t('builder.midline')}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button type="button" className="grid h-7 w-7 place-items-center rounded-full border border-line disabled:opacity-40" disabled={l.qty <= 1}
                          onClick={() => change(setQty(pieces, l.key, l.side, l.qty - 1))} aria-label={`${t('builder.copies', { name: nm(l, lang), side: sideLabel(l.side) })} −`}><Minus className="h-3 w-3" /></button>
                        <span className="w-5 text-center text-xs font-medium text-ink" aria-label={t('builder.copies', { name: nm(l, lang), side: sideLabel(l.side) })}>{formatNumber(l.qty, lang)}</span>
                        <button type="button" className="grid h-7 w-7 place-items-center rounded-full border border-line disabled:opacity-40" disabled={l.qty >= 10}
                          onClick={() => change(setQty(pieces, l.key, l.side, l.qty + 1))} aria-label={`${t('builder.copies', { name: nm(l, lang), side: sideLabel(l.side) })} +`}><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="w-16 shrink-0 text-right text-xs font-semibold text-ink">{l.amount ? money(l.amount) : ''}</span>
                      <button type="button" onClick={() => change(pieces.filter((p) => !(p.k === l.key && p.s === l.side)))}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-stone hover:bg-line/60 hover:text-destructive" aria-label={t('builder.removeName', { name: nm(l, lang) })}><X className="h-3.5 w-3.5" /></button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
      {nearSet && (
        <div className="mt-3 rounded-xl border border-dashed border-clay/50 p-3 text-xs text-ink">
          <Sparkles className="mr-1 inline h-3.5 w-3.5 text-clay" />
          {t('builder.completeHint', { missing: formatNumber(nearSet.missing, lang), set: setName(nearSet.key), price: money(nearSet.price) })}
          <button type="button" className="ml-1 font-medium text-clay hover:underline" onClick={() => { setMode(nearSet.key); change(nearSet.target) }}>{t('builder.add')}</button>
        </div>
      )}
      {!qt.set && mode !== 'custom' && pieces.length > 0 && !nearSet && (
        <p className="mt-3 text-xs text-stone">{t('builder.breaksSet', { set: setName(mode) })}</p>
      )}
      <div className="mt-auto border-t border-line pt-3">
        {qt.saving > 0 && <p className="text-xs text-[#5B8A5B]">{t('builder.saving', { amount: money(qt.saving) })}</p>}
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-sm text-stone">{t('builder.total')} <span className="text-xs">({t('builder.piecesCount', { n: formatNumber(qt.pieces || 0, lang) })})</span></span>
          <span className="font-display text-2xl font-semibold text-ink">{money(qt.total || 0)}</span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-stone">{t('builder.priceNote')}</p>
        <button type="button" onClick={addToCart} disabled={!live || busy || !qt.ok || !qt.total}
          className="btn-primary mt-3 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('builder.adding')}</> : <><ShoppingBag className="h-4 w-4" /> {inCart ? t('builder.updateCart') : t('builder.addToCart')}</>}
        </button>
        {notice && (
          <p className={`mt-2 text-xs ${notice.kind === 'ok' ? 'text-[#5B8A5B]' : 'text-destructive'}`} role="status">
            {notice.text} {notice.kind === 'ok' && <Link href="/cart" className="font-medium text-clay hover:underline">{t('builder.viewCart')}</Link>}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div className="pb-28 lg:pb-0">
      <p ref={announce} className="sr-only" aria-live="polite" />
      {/* How to buy */}
      <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label={t('builder.modeTitle')}>
        {[
          { key: 'custom', title: t('builder.modeCustom'), hint: t('builder.modeCustomHint') },
          { key: 'half', title: setName('half') || t('builder.modeHalf'), hint: `${t('builder.modeHalfHint')} · ${t('builder.setIncludes', { count: formatNumber(countIncluded(catalog, 'half'), lang) })}`, price: idx.bundles.half?.price },
          { key: 'full', title: setName('full') || t('builder.modeFull'), hint: `${t('builder.modeFullHint')} · ${t('builder.setIncludes', { count: formatNumber(countIncluded(catalog, 'full'), lang) })}`, price: idx.bundles.full?.price },
        ].map((m) => {
          const active = m.key === 'custom' ? !qt.set : qt.set === m.key
          return (
            <button key={m.key} type="button" aria-pressed={active}
              onClick={() => (m.key === 'custom' ? (qt.set ? clearAll() : setMode('custom')) : startSet(m.key))}
              className={`rounded-2xl border p-3.5 text-left transition-colors ${active ? 'border-clay bg-clay/[0.07] ring-1 ring-clay/40' : 'border-line bg-paper hover:border-clay/40'}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-[15px] font-semibold text-ink">{m.title}</span>
                {m.price ? <span className="text-sm font-semibold text-clay">{money(m.price)}</span> : active ? <Check className="h-4 w-4 text-clay" /> : null}
              </span>
              <span className="mt-0.5 block text-xs text-stone">{m.hint}</span>
            </button>
          )
        })}
      </div>
      {qt.set === 'half' && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone">
          <span>{t('builder.setSide')}:</span>
          {['L', 'R'].map((s) => (
            <button key={s} type="button" aria-pressed={halfSide === s} onClick={() => flipHalf(s)}
              className={`rounded-full border px-3 py-1 font-medium ${halfSide === s ? 'border-clay bg-clay text-paper' : 'border-line bg-paper text-ink hover:border-clay/40'}`}>{sideLabel(s)}</button>
          ))}
          <span className="hidden sm:inline">{t('builder.setSideHint')}</span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        {/* Bone list */}
        <section aria-label={t('builder.sections')} className="sk-scroll order-2 min-w-0 rounded-2xl border border-line bg-paper p-3 lg:order-1 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto">
          <label className="relative block">
            <span className="sr-only">{t('builder.search')}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('builder.searchPlaceholder')}
              className="h-10 w-full rounded-xl border border-line bg-cream/60 pl-9 pr-3 text-sm text-ink placeholder:text-stone focus:border-clay/50 focus:outline-none" />
          </label>
          <div className="sk-noscrollbar -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label={t('builder.sections')}>
            {[{ key: 'all', name_en: t('builder.allSections'), name_bn: t('builder.allSections') }, ...sections].map((s) => (
              <button key={s.key} type="button" role="tab" aria-selected={section === s.key} onClick={() => setSection(s.key)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${section === s.key ? 'border-clay bg-clay text-paper' : 'border-line text-ink hover:border-clay/40'}`}>
                {nm(s, lang)}
              </button>
            ))}
          </div>
          <div className="mt-2">
            {sections.filter((s) => section === 'all' || s.key === section).map((s) => {
              const rows = visible.filter((i) => i.section === s.key)
              if (!rows.length) return null
              const groups = [...new Set(rows.map((r) => r.grp))]
              return (
                <div key={s.key} className="mt-3 first:mt-1">
                  <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-clay">{nm(s, lang)}</h3>
                  {groups.map((g) => (
                    <div key={g} className="mt-1.5">
                      {groups.length > 1 && <p className="px-1 text-[11px] text-stone">{lang === 'bn' ? GROUPS_BN[g] || g : g}</p>}
                      <ul className="mt-1 space-y-1">
                        {rows.filter((r) => r.grp === g).map((it) => (
                          <BoneRow key={it.key} it={it} lang={lang} t={t} money={money} option={optionOf(pieces, it)} focused={focus === it.key}
                            inSet={qt.set && included.some((l) => l.key === it.key)}
                            onToggle={() => toggle(it)} onChoose={(o) => choose(it, o)} onFocus={() => setFocus(it.key)} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )
            })}
            {!visible.length && <p className="px-1 py-6 text-center text-sm text-stone">{t('builder.noResults', { q })}</p>}
          </div>
        </section>

        {/* 3D viewer */}
        <section className="order-1 min-w-0 lg:order-2">
          <div className="relative h-[56vh] min-h-[360px] overflow-hidden rounded-3xl border border-line bg-[radial-gradient(ellipse_at_50%_35%,rgb(var(--paper))_0%,rgb(var(--cream))_70%)] lg:h-[calc(100vh-140px)] lg:min-h-[560px]">
            {load3d ? (
              <SkeletonViewer colorFor={colorFor} pickable={pickable} onPick={pickMesh} labelFor={labelFor} view={view} viewNonce={viewNonce} zoomNonce={zoomNonce} t={t} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <img src="/models/skeleton-front.webp" alt="" className="max-h-[60%] w-auto opacity-70" />
                <p className="max-w-xs text-sm text-stone">{t('builder.saveDataNote')}</p>
                <button type="button" className="btn-primary" onClick={() => setLoad3d(true)}>{t('builder.load3d')}</button>
              </div>
            )}
            {/* View controls */}
            <div className="absolute right-3 top-3 flex flex-col gap-1.5">
              {[['front', t('builder.front')], ['back', t('builder.back')], ['left', t('builder.leftView')], ['right', t('builder.rightView')]].map(([v, label]) => (
                <button key={v} type="button" onClick={() => goView(v)} aria-pressed={view === v}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur ${view === v ? 'border-clay bg-clay text-paper' : 'border-line bg-paper/90 text-ink hover:border-clay/40'}`}>{label}</button>
              ))}
              <div className="mt-1 flex gap-1.5 self-end">
                <button type="button" onClick={() => setZoomNonce({ dir: 1, n: Date.now() })} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-paper/90 text-ink shadow-sm" aria-label={t('builder.zoomIn')}><ZoomIn className="h-4 w-4" /></button>
                <button type="button" onClick={() => setZoomNonce({ dir: -1, n: Date.now() })} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-paper/90 text-ink shadow-sm" aria-label={t('builder.zoomOut')}><ZoomOut className="h-4 w-4" /></button>
                <button type="button" onClick={() => goView('front')} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-paper/90 text-ink shadow-sm" aria-label={t('builder.reset')}><RotateCcw className="h-4 w-4" /></button>
              </div>
            </div>
            {!focusItem && <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-paper/85 px-3 py-1.5 text-xs text-stone backdrop-blur">{t('builder.tapHint')} · {t('builder.dragHint')}</p>}
            {focusItem && (
              <BoneCard it={focusItem} catalog={catalog} sections={sections} lang={lang} t={t} money={money} option={optionOf(pieces, focusItem)}
                inSet={qt.set && included.some((l) => l.key === focusItem.key) ? setName(qt.set) : null}
                inAssembled={['hip', 'sacrum', 'coccyx'].includes(focusItem.key) && pieces.some((p) => p.k === 'pelvis')}
                onChoose={(o) => choose(focusItem, o)} onClose={() => setFocus(null)}
                onFocusItem={(k) => setFocus(k)} />
            )}
          </div>
          <p className="mt-2 px-1 text-[11px] text-stone">{t('builder.modelNote')}</p>
        </section>

        {/* Summary (desktop) */}
        <aside className="order-3 hidden min-w-0 rounded-2xl border border-line bg-paper p-4 lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-140px)]">
          {renderSummary(false)}
        </aside>
      </div>

      {/* Mobile: sticky price bar + summary sheet */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-stone">{qt.set ? setName(qt.set) : t('builder.piecesCount', { n: formatNumber(qt.pieces || 0, lang) })}{qt.set && extras.length ? ` + ${formatNumber(extras.length, lang)}` : ''}</p>
            <p className="font-display text-xl font-semibold text-ink">{money(qt.total || 0)}</p>
          </div>
          <button type="button" onClick={() => setSheet(true)} className="btn-ghost text-sm">{t('builder.review')}</button>
          <button type="button" onClick={addToCart} disabled={!live || busy || !qt.ok || !qt.total} className="btn-primary text-sm disabled:opacity-50" aria-label={inCart ? t('builder.updateCart') : t('builder.addToCart')}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
          </button>
        </div>
        {notice && <p className={`mx-auto mt-1 max-w-xl text-xs ${notice.kind === 'ok' ? 'text-[#5B8A5B]' : 'text-destructive'}`} role="status">{notice.text} {notice.kind === 'ok' && <Link href="/cart" className="font-medium text-clay">{t('builder.viewCart')}</Link>}</p>}
      </div>
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden" role="dialog" aria-modal="true" aria-label={t('builder.summary')}>
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t('builder.close')} onClick={() => setSheet(false)} />
          <div className="sk-scroll relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-paper p-5 pb-8">
            <button type="button" onClick={() => setSheet(false)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-line" aria-label={t('builder.close')}><X className="h-4 w-4" /></button>
            {renderSummary(true)}
          </div>
        </div>
      )}

      {pendingSet && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="set-dialog-title">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t('builder.cancel')} onClick={() => setPendingSet(null)} />
          <div className="relative w-full max-w-sm rounded-3xl border border-line bg-paper p-6 shadow-xl">
            <h2 id="set-dialog-title" className="font-display text-lg font-semibold text-ink">{t('builder.replaceTitle')}</h2>
            <p className="mt-2 text-sm text-stone">{t('builder.replaceText', { set: setName(pendingSet.key) })}</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-ghost text-sm" onClick={() => setPendingSet(null)}>{t('builder.cancel')}</button>
              <button type="button" className="btn-ghost text-sm" onClick={() => finishSet(pendingSet.key, pendingSet.side, false)}>{t('builder.replace')}</button>
              <button type="button" className="btn-primary text-sm" onClick={() => finishSet(pendingSet.key, pendingSet.side, true)}>{t('builder.keepExtras')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function priceText(it, t, money) {
  if (it.kind === 'paired') return `${t('builder.priceOneSide', { price: money(it.half_price) })} · ${t('builder.pricePair', { price: money(it.full_price) })}`
  return money(it.half_price)
}

function BoneRow({ it, lang, t, money, option, focused, inSet, onToggle, onChoose, onFocus }) {
  const available = it.is_active && it.is_available
  return (
    <li className={`rounded-xl border px-2.5 py-2 transition-colors ${focused ? 'border-clay/60 bg-clay/[0.05]' : option ? 'border-clay/30 bg-paper' : 'border-transparent hover:bg-cream/70'}`}>
      <div className="flex items-start gap-2">
        <button type="button" onClick={onFocus} className="min-w-0 flex-1 text-left" aria-label={`${nm(it, lang)} — ${t('builder.status')}`}>
          <span className="block text-sm font-medium leading-tight text-ink">{nm(it, lang)}</span>
          {lang === 'bn' ? <span className="block text-[11px] text-stone">{it.name_en}</span> : it.name_bn ? <span lang="bn" className="block font-bangla text-[11px] text-stone">{it.name_bn}</span> : null}
          <span className="mt-0.5 block text-[11px] text-stone">{available ? priceText(it, t, money) : t('builder.unavailable')}</span>
        </button>
        {available && it.kind !== 'paired' && (
          <button type="button" onClick={onToggle} aria-pressed={Boolean(option)}
            aria-label={`${option ? t('builder.remove') : t('builder.add')} ${nm(it, lang)}, ${money(it.half_price)}`}
            className={`mt-0.5 inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-medium ${option ? 'border-clay bg-clay text-paper' : 'border-line text-ink hover:border-clay/50'}`}>
            {option ? <><Check className="h-3.5 w-3.5" /> {inSet ? t('builder.included') : t('builder.added')}</> : <><Plus className="h-3.5 w-3.5" /> {t('builder.add')}</>}
          </button>
        )}
      </div>
      {available && it.kind === 'paired' && (
        <div className="mt-1.5 flex gap-1" role="group" aria-label={`${nm(it, lang)} — ${t('builder.options')}`}>
          {[['L', t('builder.left'), it.half_price], ['R', t('builder.right'), it.half_price], ['both', t('builder.both'), it.full_price]].map(([o, label, price]) => (
            <button key={o} type="button" aria-pressed={option === o} onClick={() => onChoose(option === o ? null : o)}
              aria-label={`${nm(it, lang)}, ${label}, ${money(price)}`}
              className={`flex-1 rounded-lg border px-1.5 py-1 text-[11px] font-medium ${option === o ? 'border-clay bg-clay text-paper' : 'border-line text-ink hover:border-clay/50'}`}>
              {label}
            </button>
          ))}
        </div>
      )}
    </li>
  )
}

function BoneCard({ it, catalog, sections, lang, t, money, option, inSet, inAssembled, onChoose, onClose, onFocusItem }) {
  const sec = sections.find((s) => s.key === it.section)
  const mem = setMembership(catalog, it.key)
  const sideText = it.kind === 'paired' ? `${t('builder.left')} / ${t('builder.right')}` : it.kind === 'grouped' ? t('builder.assembled') : t('builder.midline')
  const statusText = inSet ? t('builder.statusInSet', { set: inSet })
    : option ? t('builder.statusSelected', { what: option === 'both' ? t('builder.both') : option === 'L' ? t('builder.left') : option === 'R' ? t('builder.right') : t('builder.single') })
      : t('builder.statusNone')
  const related = ['hip', 'sacrum', 'coccyx'].includes(it.key) ? catalog.items.find((i) => i.key === 'pelvis') : it.key === 'pelvis' ? null : null
  const available = it.is_active && it.is_available
  return (
    <div className="absolute inset-x-3 bottom-3 z-20 rounded-2xl border border-line bg-paper/95 p-4 shadow-lg backdrop-blur sm:right-auto sm:w-[340px]" role="region" aria-label={nm(it, lang)}>
      <button type="button" onClick={onClose} className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-stone hover:bg-line/60" aria-label={t('builder.close')}><X className="h-4 w-4" /></button>
      <p className="pr-8 font-display text-base font-semibold leading-tight text-ink">{it.name_en}</p>
      {it.name_bn && <p lang="bn" className="font-bangla text-sm text-stone">{it.name_bn}</p>}
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
        <dt className="text-stone">{t('builder.section')}</dt><dd className="text-ink">{nm(sec, lang)}</dd>
        <dt className="text-stone">{t('builder.sideLabel')}</dt><dd className="text-ink">{sideText}</dd>
        <dt className="text-stone">{t('builder.options')}</dt>
        <dd className="text-ink">{available ? (it.kind === 'paired' ? `${t('builder.priceOneSide', { price: money(it.half_price) })} · ${t('builder.pricePair', { price: money(it.full_price) })}` : money(it.half_price)) : t('builder.unavailable')}</dd>
        <dt className="text-stone">{t('builder.status')}</dt><dd className="font-medium text-ink">{statusText}</dd>
      </dl>
      <p className="mt-1.5 text-[11px] text-stone">{[mem.half && t('builder.inHalf'), mem.full && t('builder.inFull')].filter(Boolean).join(' · ') || t('builder.notInSets')}</p>
      {inAssembled && <p className="mt-1.5 rounded-lg bg-clay/10 px-2 py-1 text-[11px] text-ink">{t('builder.inAssembled')}</p>}
      {(lang === 'bn' ? it.note_bn : it.note_en) && <p className="mt-1.5 flex gap-1.5 text-[11px] text-stone"><Info className="mt-px h-3.5 w-3.5 shrink-0 text-clay" />{lang === 'bn' ? it.note_bn : it.note_en}</p>}
      {available && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {it.kind === 'paired'
            ? [['L', t('builder.left')], ['R', t('builder.right')], ['both', t('builder.both')]].map(([o, label]) => (
              <button key={o} type="button" aria-pressed={option === o} onClick={() => onChoose(option === o ? null : o)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${option === o ? 'border-clay bg-clay text-paper' : 'border-line text-ink hover:border-clay/50'}`}>{label}</button>
            ))
            : <button type="button" aria-pressed={Boolean(option)} onClick={() => onChoose(option ? null : 'S')}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${option ? 'border-clay bg-clay text-paper' : 'border-line text-ink hover:border-clay/50'}`}>{option ? t('builder.remove') : t('builder.add')}</button>}
          {option && it.kind === 'paired' && <button type="button" onClick={() => onChoose(null)} className="rounded-full px-3 py-1.5 text-xs text-stone hover:text-destructive">{t('builder.remove')}</button>}
        </div>
      )}
      {related && (
        <button type="button" onClick={() => onFocusItem(related.key)} className="mt-2 text-left text-[11px] font-medium text-clay hover:underline">
          {nm(related, lang)} — {money(related.half_price)} ({lang === 'bn' ? related.note_bn : related.note_en})
        </button>
      )}
    </div>
  )
}
