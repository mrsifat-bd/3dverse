// Pure helpers for the builder's selection state (a list of pieces
// { k, s: 'L'|'R'|'S', q }). Kept free of React so they are unit tested.
import { piecesForSet, mergePieces, MAX_QTY_PER_PIECE, indexCatalog } from './pricing'

// 3D object name -> { key, side } for clicking. Grouped products (assembled
// pelvis, skull bases) never own a mesh: tapping a pelvic bone selects the
// loose bone, and the card offers the assembled model.
export function meshIndex(catalog) {
  const map = {}
  const items = [...(catalog?.items || [])].sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0))
  for (const it of items) {
    if (it.kind === 'grouped' || it.kind === 'pool') continue
    for (const [side, names] of Object.entries(it.meshes || {})) for (const n of names) if (!map[n]) map[n] = { key: it.key, side }
    for (const [n, side] of Object.entries(it.aliases || {})) if (!map[n]) map[n] = { key: it.key, side }
  }
  return map
}

export const has = (pieces, k, s) => pieces.some((p) => p.k === k && (s === undefined || p.s === s))
export const sidesOf = (pieces, k) => pieces.filter((p) => p.k === k).map((p) => p.s)

// What option an item is set to: null | 'L' | 'R' | 'both' | 'S'.
export function optionOf(pieces, item) {
  const s = sidesOf(pieces, item.key)
  if (!s.length) return null
  if (item.kind !== 'paired') return 'S'
  return s.includes('L') && s.includes('R') ? 'both' : s[0]
}

// Set an item to an option, keeping extra copies of sides that stay.
export function setOption(pieces, item, option) {
  const keep = pieces.filter((p) => p.k !== item.key)
  const old = Object.fromEntries(pieces.filter((p) => p.k === item.key).map((p) => [p.s, p.q || 1]))
  if (!option) return keep
  const want = item.kind !== 'paired' ? ['S'] : option === 'both' ? ['L', 'R'] : [option]
  return [...keep, ...want.map((s) => ({ k: item.key, s, q: old[s] || 1 }))]
}

export function setQty(pieces, k, s, q) {
  const n = Math.max(1, Math.min(MAX_QTY_PER_PIECE, Math.round(Number(q) || 1)))
  return pieces.map((p) => (p.k === k && p.s === s ? { ...p, q: n } : p))
}

// Union of two selections: a piece in both keeps the larger quantity (adding a
// set on top of a femur you already picked never makes a second femur).
export function unionPieces(a, b) {
  const m = new Map()
  for (const p of [...a, ...b]) {
    const id = `${p.k}:${p.s}`
    const cur = m.get(id)
    m.set(id, { k: p.k, s: p.s, q: Math.max(cur?.q || 0, p.q || 1) })
  }
  return [...m.values()]
}

export function applySet(catalog, pieces, setKey, side, keepExtras) {
  const set = piecesForSet(catalog, setKey, side)
  return keepExtras ? unionPieces(pieces, set) : set
}

// Move every one-sided paired piece to `side` (the Half Set side switch).
export function switchAllSides(catalog, pieces, side) {
  const idx = indexCatalog(catalog)
  const out = []
  for (const p of pieces) {
    const it = idx.items[p.k]
    const sides = sidesOf(pieces, p.k)
    if (it?.kind === 'paired' && sides.length === 1) out.push({ ...p, s: side })
    else out.push(p)
  }
  return mergePieces(out)
}

// Colour role of each 3D object for the current selection.
export function meshRoles(catalog, pieces, focusKey) {
  const idx = indexCatalog(catalog)
  const roles = {}
  for (const p of pieces) {
    const it = idx.items[p.k]
    if (!it) continue
    const names = it.kind === 'paired' ? it.meshes[p.s] || [] : it.meshes.S || []
    const role = it.kind === 'grouped' ? 'group' : it.kind === 'pool' ? 'pool' : 'selected'
    for (const n of names) if (roles[n] !== 'selected') roles[n] = role
  }
  if (focusKey && idx.items[focusKey]) {
    for (const names of Object.values(idx.items[focusKey].meshes || {})) for (const n of names) roles[n] = 'focus'
  }
  return roles
}

// Random Left/Right for a new one-sided pick (the owner's rule).
export const randomSide = () => (Math.random() < 0.5 ? 'L' : 'R')

// Which set (if any) the item belongs to: { half: bool, full: bool }.
export function setMembership(catalog, key) {
  const out = {}
  for (const b of catalog?.bundles || []) out[b.key] = b.items.some((bi) => bi.item_key === key)
  return out
}

export function countIncluded(catalog, setKey) {
  const b = (catalog?.bundles || []).find((x) => x.key === setKey)
  if (!b) return 0
  const idx = indexCatalog(catalog)
  return b.items.reduce((a, bi) => a + (idx.items[bi.item_key]?.kind === 'paired' && bi.mode === 'full' ? 2 * bi.qty : bi.qty), 0)
}
