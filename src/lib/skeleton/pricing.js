// Skeleton Builder pricing engine (browser preview).
//
// The database function public.skeleton_quote() implements the same rules and
// is the only price an order is ever charged; this copy exists so the page can
// update instantly. Tests run both on the same cases and require equal totals.
//
// A configuration is a list of physical pieces: { k: item key, s: 'L'|'R'|'S', q }.
//
// Rules (Option C + Best-Price rule, safeguards S1–S8 from the decision report):
//   1. Every piece is priced at its normal price. One left + one right of the
//      same paired bone is a pair, priced at the pair (Full) price — but only
//      when the pair price is higher than one side (S2) and only for a real
//      left + right (S3).
//   2. If the pieces contain the whole Full Set, the Full Set saving is
//      subtracted (S1: the bigger set wins). Otherwise, if they contain the whole
//      Half Set, the Half Set saving is subtracted. One saving, once.
//      Saving = the set's own parts at normal prices − the fixed set price; a
//      saving of 0 or less is never applied (S6).
//   3. Grouped products (assembled pelvis, skull bases) never count towards a
//      set (S4). Only builder pieces count (S5). Builder prices never follow
//      shop discounts (S8). The server recomputes everything (S7).

export const MAX_QTY_PER_PIECE = 10
export const MAX_PIECES = 200
const SIDES = ['L', 'R']

export function indexCatalog(catalog) {
  const items = Object.fromEntries((catalog?.items || []).map((i) => [i.key, i]))
  const bundles = Object.fromEntries((catalog?.bundles || []).map((b) => [b.key, b]))
  return { items, bundles }
}

// Merge a raw piece list into counts { key: { L, R, S } } after validation.
export function normalisePieces(idx, pieces) {
  if (!Array.isArray(pieces)) return { error: 'invalid_config' }
  if (pieces.length > MAX_PIECES) return { error: 'too_many_pieces' }
  const counts = {}
  const seen = new Set()
  for (const p of pieces) {
    const item = idx.items[p?.k]
    if (!item) return { error: 'unknown_item', key: p?.k }
    if (!item.is_active || !item.is_available) return { error: 'unavailable_item', key: p.k }
    const side = p.s
    if (item.kind === 'paired' ? !SIDES.includes(side) : side !== 'S') return { error: 'invalid_side', key: p.k }
    const q = p.q === undefined ? 1 : p.q
    if (!Number.isInteger(q) || q < 1 || q > MAX_QTY_PER_PIECE) return { error: 'invalid_qty', key: p.k }
    const id = `${p.k}:${side}`
    if (seen.has(id)) return { error: 'duplicate_piece', key: p.k }
    seen.add(id)
    counts[p.k] = counts[p.k] || { L: 0, R: 0, S: 0 }
    counts[p.k][side] += q
  }
  return { counts }
}

const pairPrice = (item) => (item.kind === 'paired' && Number(item.full_price) > Number(item.half_price) ? Number(item.full_price) : null)

// Normal price of one item's pieces.
export function itemCost(item, c) {
  if (!c) return 0
  const half = Number(item.half_price)
  if (item.kind === 'paired') {
    const pp = pairPrice(item)
    const pairs = pp ? Math.min(c.L, c.R) : 0
    return pairs * pp + (c.L + c.R - 2 * pairs) * half
  }
  return c.S * half
}

const itemWeight = (item, c) => (c ? (c.L + c.R + c.S) * Number(item.weight_kg || 0) : 0)

// Does `counts` contain every piece of the bundle?
function containsSet(idx, bundle, counts) {
  for (const bi of bundle.items) {
    const item = idx.items[bi.item_key]
    if (!item) return false
    if (item.kind === 'pool') {
      const n = (item.pool_of || []).concat(item.key).reduce((a, k) => a + (counts[k] ? counts[k].S : 0), 0)
      if (n < bi.qty) return false
      continue
    }
    const c = counts[bi.item_key]
    if (!c) return false
    if (item.kind === 'paired') {
      if (bi.mode === 'full' ? c.L < bi.qty || c.R < bi.qty : c.L + c.R < bi.qty) return false
    } else if (c.S < bi.qty) return false
  }
  return true
}

// Remove the bundle's own pieces from `counts` (left side first for Half).
function consumeSet(idx, bundle, counts) {
  const rest = JSON.parse(JSON.stringify(counts))
  const used = {}
  const take = (k, side, n) => { rest[k][side] -= n; used[k] = used[k] || { L: 0, R: 0, S: 0 }; used[k][side] += n }
  for (const bi of bundle.items) {
    const item = idx.items[bi.item_key]
    if (item.kind === 'pool') {
      let need = bi.qty
      for (const k of [item.key, ...(item.pool_of || [])]) {
        if (!rest[k] || need <= 0) continue
        const n = Math.min(need, rest[k].S); if (n > 0) { take(k, 'S', n); need -= n }
      }
    } else if (item.kind === 'paired') {
      if (bi.mode === 'full') { take(bi.item_key, 'L', bi.qty); take(bi.item_key, 'R', bi.qty) }
      else { const c = rest[bi.item_key]; const side = c.L >= bi.qty ? 'L' : 'R'; take(bi.item_key, side, bi.qty) }
    } else take(bi.item_key, 'S', bi.qty)
  }
  return { rest, used }
}

// The bundle's own pieces (for its saving): Half = left side of each paired bone.
export function setPieces(idx, bundle, side = 'L') {
  const counts = {}
  for (const bi of bundle.items) {
    const item = idx.items[bi.item_key]
    if (!item) continue
    counts[bi.item_key] = counts[bi.item_key] || { L: 0, R: 0, S: 0 }
    if (item.kind === 'paired') {
      if (bi.mode === 'full') { counts[bi.item_key].L += bi.qty; counts[bi.item_key].R += bi.qty } else counts[bi.item_key][side] += bi.qty
    } else counts[bi.item_key].S += bi.qty
  }
  return counts
}

export function individualTotal(idx, counts) {
  return Object.entries(counts).reduce((a, [k, c]) => a + itemCost(idx.items[k], c), 0)
}

export function setSaving(idx, bundle) {
  if (!bundle || !bundle.is_active) return 0
  return individualTotal(idx, setPieces(idx, bundle)) - Number(bundle.price)
}

// Main entry point. Returns { ok, total, ... } or { ok:false, error, key }.
export function quote(catalog, config) {
  const idx = indexCatalog(catalog)
  const norm = normalisePieces(idx, config?.pieces)
  if (norm.error) return { ok: false, error: norm.error, key: norm.key }
  const counts = norm.counts
  if (!Object.keys(counts).length) return { ok: true, total: 0, individual: 0, saving: 0, set: null, lines: [], weight_kg: 0, pieces: 0 }

  const individual = individualTotal(idx, counts)
  let set = null
  for (const key of ['full', 'half']) { // S1: the bigger set is checked first
    const b = idx.bundles[key]
    if (b && b.is_active && setSaving(idx, b) > 0 && containsSet(idx, b, counts)) { set = b; break }
  }

  const lines = []
  let weight = 0
  let saving = 0
  let rest = counts
  if (set) {
    saving = setSaving(idx, set)
    const r = consumeSet(idx, set, counts)
    rest = r.rest
    lines.push({ type: 'set', key: set.key, name_en: set.name_en, name_bn: set.name_bn, amount: Number(set.price) })
    for (const [k, c] of Object.entries(r.used)) {
      for (const side of ['L', 'R', 'S']) if (c[side]) lines.push({ type: 'included', key: k, side, qty: c[side], name_en: idx.items[k].name_en, name_bn: idx.items[k].name_bn, amount: 0 })
    }
    weight += Number(set.weight_kg || 0)
  }
  for (const [k, c] of Object.entries(rest)) {
    const item = idx.items[k]
    const extra = itemCost(item, counts[k]) - itemCost(item, set ? counts[k] && subtract(counts[k], c) : null)
    for (const side of ['L', 'R', 'S']) {
      if (!c[side]) continue
      lines.push({ type: 'extra', key: k, side, qty: c[side], name_en: item.name_en, name_bn: item.name_bn, amount: 0 })
    }
    // Put the item's whole extra amount on its first extra line (keeps sums exact).
    const first = lines.find((l) => l.type === 'extra' && l.key === k)
    if (first) first.amount = extra
    weight += itemWeight(item, c)
  }
  const total = individual - saving
  return { ok: true, total, individual, saving, set: set ? set.key : null, lines, weight_kg: Math.round(weight * 1000) / 1000, pieces: countPieces(counts) }
}

function subtract(all, rest) { return { L: all.L - rest.L, R: all.R - rest.R, S: all.S - rest.S } }
const countPieces = (counts) => Object.values(counts).reduce((a, c) => a + c.L + c.R + c.S, 0)

// Build the piece list for a set (used by the "Half Set" / "Full Set" buttons).
// sides: { itemKey: 'L'|'R' } overrides for Half Set paired bones.
export function piecesForSet(catalog, setKey, defaultSide = 'L', sides = {}) {
  const idx = indexCatalog(catalog)
  const b = idx.bundles[setKey]
  if (!b) return []
  const out = []
  for (const bi of b.items) {
    const item = idx.items[bi.item_key]
    if (!item) continue
    if (item.kind === 'paired') {
      if (bi.mode === 'full') { out.push({ k: item.key, s: 'L', q: bi.qty }, { k: item.key, s: 'R', q: bi.qty }) } else out.push({ k: item.key, s: sides[item.key] || defaultSide, q: bi.qty })
    } else out.push({ k: item.key, s: 'S', q: bi.qty })
  }
  return mergePieces(out)
}

export function mergePieces(list) {
  const m = new Map()
  for (const p of list) {
    const id = `${p.k}:${p.s}`
    m.set(id, { k: p.k, s: p.s, q: Math.min(MAX_QTY_PER_PIECE, (m.get(id)?.q || 0) + (p.q || 1)) })
  }
  return [...m.values()]
}
