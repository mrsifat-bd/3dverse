import { describe, it, expect } from 'vitest'
import { SKELETON_CATALOG as CAT, ITEMS, BUNDLES } from '../skeleton/catalog'
import { quote, piecesForSet, setSaving, indexCatalog, mergePieces } from '../skeleton/pricing'

// The owner's supplied brief, typed in again independently of catalog.js,
// plus the explicit decisions of 5 Nov 2026 (Hyoid ৳180, both feet ৳3,100,
// lumbar ৳200 each, Pelvis Articulated ৳4,750 single price).
const BRIEF = {
  base_vault: [4100, null], base_only: [3000, null],
  mandible: [350, 350], maxilla: [250, 500], occipital: [550, 550], frontal: [450, 450], temporal: [450, 900], parietal: [450, 900],
  sphenoid: [700, 700], ethmoid: [100, 100], hyoid: [180, 180], atlas: [150, 150], axis: [150, 150], c7: [150, 150],
  c3: [150, 150], c4: [150, 150], c5: [150, 150], c6: [150, 150],
  scapula: [380, 760], clavicle: [250, 480], humerus: [650, 1300], radius: [360, 720], ulna: [360, 720], wrist: [1000, 1850],
  sacrum: [1000, 1000], coccyx: [120, 120], hip: [1800, 3600], pelvis: [4750, null],
  l1: [200, 200], l2: [200, 200], l3: [200, 200], l4: [200, 200], l5: [200, 200],
  femur: [1640, 3200], tibia: [1540, 3000], fibula: [820, 1600], patella: [100, 180], foot: [1550, 3100],
  sternum: [350, 350], manubrium: [100, 100], typical_rib: [210, 420], rib1: [200, 400], rib2: [340, 680], rib11: [150, 300],
  ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`th${i + 1}`, [180, 180]])),
}
const SET_LIST = ['mandible', 'maxilla', 'occipital', 'frontal', 'temporal', 'parietal', 'sphenoid', 'ethmoid', 'hyoid', 'atlas', 'axis',
  'scapula', 'clavicle', 'humerus', 'radius', 'ulna', 'wrist', 'sacrum', 'coccyx', 'hip', 'femur', 'tibia', 'fibula', 'patella', 'foot',
  'sternum', 'typical_rib', 'rib1', 'rib2', 'rib11', 'th4', 'th5']

const q = (pieces) => quote(CAT, { pieces })
const HALF = () => piecesForSet(CAT, 'half', 'L')
const FULL = () => piecesForSet(CAT, 'full')
const add = (pieces, ...more) => mergePieces([...pieces, ...more])
const without = (pieces, k, s) => pieces.filter((p) => !(p.k === k && p.s === s))

describe('catalogue matches the approved prices', () => {
  it('every supplied price is unchanged (Hyoid ৳180 is the only override)', () => {
    for (const [k, [h, f]] of Object.entries(BRIEF)) {
      const item = ITEMS.find((i) => i.key === k)
      expect(item, k).toBeTruthy()
      expect(item.half_price, k).toBe(h)
      if (f !== null) expect(item.full_price, k).toBe(f)
    }
    expect(ITEMS.find((i) => i.key === 'hyoid').half_price).toBe(180)
  })
  it('set prices are fixed at ৳16,300 and ৳23,500', () => {
    expect(BUNDLES.find((b) => b.key === 'half').price).toBe(16300)
    expect(BUNDLES.find((b) => b.key === 'full').price).toBe(23500)
  })
  it('both sets contain exactly the supplied bones plus any two lumbar vertebrae', () => {
    for (const b of BUNDLES) {
      const keys = b.items.map((i) => i.item_key)
      expect(keys.filter((k) => k !== 'lumbar_any').sort()).toEqual([...SET_LIST].sort())
      expect(b.items.find((i) => i.item_key === 'lumbar_any').qty).toBe(2)
    }
  })
  it('Full Set has both legs: every paired bone both sides, including femur, tibia, fibula, patella and both feet', () => {
    const full = FULL()
    for (const k of ['femur', 'tibia', 'fibula', 'patella', 'foot', 'hip', 'humerus']) {
      expect(full.some((p) => p.k === k && p.s === 'L')).toBe(true)
      expect(full.some((p) => p.k === k && p.s === 'R')).toBe(true)
    }
  })
  it('midline and grouped items have no left/right', () => {
    for (const i of ITEMS) if (i.kind !== 'paired') expect(Object.keys(i.meshes)).toEqual(['S'])
  })
  it('Manubrium is unavailable', () => {
    const m = ITEMS.find((i) => i.key === 'manubrium')
    expect(m.is_active).toBe(false)
    expect(q([{ k: 'manubrium', s: 'S' }])).toMatchObject({ ok: false, error: 'unavailable_item' })
  })
})

describe('individual prices', () => {
  it('each item: one side / single = its Half price; a left+right pair = its Full price', () => {
    for (const item of ITEMS.filter((i) => i.is_active && i.listed)) {
      if (item.kind === 'paired') {
        expect(q([{ k: item.key, s: 'L' }]).total, item.key).toBe(BRIEF[item.key][0])
        expect(q([{ k: item.key, s: 'R' }]).total, item.key).toBe(BRIEF[item.key][0])
        expect(q([{ k: item.key, s: 'L' }, { k: item.key, s: 'R' }]).total, item.key).toBe(BRIEF[item.key][1])
      } else expect(q([{ k: item.key, s: 'S' }]).total, item.key).toBe(BRIEF[item.key][0])
    }
  })
  it('Hyoid ৳180', () => expect(q([{ k: 'hyoid', s: 'S' }]).total).toBe(180))
  it('Foot: one foot ৳1,550, both feet ৳3,100', () => {
    expect(q([{ k: 'foot', s: 'L' }]).total).toBe(1550)
    expect(q([{ k: 'foot', s: 'L' }, { k: 'foot', s: 'R' }]).total).toBe(3100)
  })
  it('Lumbar ৳200 each, all five ৳1,000', () => {
    expect(q([{ k: 'l3', s: 'S' }]).total).toBe(200)
    expect(q(['l1', 'l2', 'l3', 'l4', 'l5'].map((k) => ({ k, s: 'S' }))).total).toBe(1000)
  })
  it('Pelvis Articulated is one price, ৳4,750', () => expect(q([{ k: 'pelvis', s: 'S' }]).total).toBe(4750))
})

describe('sets', () => {
  it('Half Set = ৳16,300 whichever side is chosen', () => {
    expect(q(HALF()).total).toBe(16300)
    expect(q(piecesForSet(CAT, 'half', 'R')).total).toBe(16300)
    expect(q(HALF()).set).toBe('half')
  })
  it('Full Set = ৳23,500 with both legs', () => {
    const r = q(FULL())
    expect(r.total).toBe(23500)
    expect(r.set).toBe('full')
    const inc = r.lines.filter((l) => l.type === 'included')
    for (const k of ['femur', 'tibia', 'fibula', 'patella', 'foot']) {
      expect(inc.some((l) => l.key === k && l.side === 'L')).toBe(true)
      expect(inc.some((l) => l.key === k && l.side === 'R')).toBe(true)
    }
  })
  it('the set price is the only charge for its bones (included lines are ৳0)', () => {
    const r = q(FULL())
    expect(r.lines.filter((l) => l.type === 'set')).toHaveLength(1)
    expect(r.lines.filter((l) => l.type === 'included').every((l) => l.amount === 0)).toBe(true)
    expect(r.lines.some((l) => l.type === 'extra')).toBe(false)
  })
  it('savings are positive with the approved prices', () => {
    const idx = indexCatalog(CAT)
    expect(setSaving(idx, idx.bundles.half)).toBe(17360 - 16300)
    expect(setSaving(idx, idx.bundles.full)).toBe(29470 - 23500)
  })
  it('a per-bone side change inside the Half Set keeps ৳16,300', () => {
    const p = piecesForSet(CAT, 'half', 'L', { femur: 'R', hip: 'R' })
    expect(q(p).total).toBe(16300)
  })
})

describe('Option C: sets plus extra bones', () => {
  it('Half Set + other side of the femur = 16,300 + (3,200 − 1,640)', () => expect(q(add(HALF(), { k: 'femur', s: 'R' })).total).toBe(17860))
  it('Half Set + femur, tibia, fibula pairs', () => expect(q(add(HALF(), { k: 'femur', s: 'R' }, { k: 'tibia', s: 'R' }, { k: 'fibula', s: 'R' })).total).toBe(16300 + 1560 + 1460 + 780))
  it('Half Set + second foot = + ৳1,550 (never free)', () => expect(q(add(HALF(), { k: 'foot', s: 'R' })).total).toBe(16300 + 1550))
  it('Half Set + C3–C7', () => expect(q(add(HALF(), ...['c3', 'c4', 'c5', 'c6', 'c7'].map((k) => ({ k, s: 'S' })))).total).toBe(16300 + 750))
  it('Half Set + all five lumbar vertebrae: the two in the set + five more', () => expect(q(add(HALF(), ...['l1', 'l2', 'l3', 'l4', 'l5'].map((k) => ({ k, s: 'S' })))).total).toBe(16300 + 1000))
  it('Full Set + the other thoracic vertebrae', () => expect(q(add(FULL(), ...[1, 2, 3, 6, 7, 8, 9, 10, 11, 12].map((n) => ({ k: `th${n}`, s: 'S' })))).total).toBe(23500 + 1800))
  it('Full Set + a second right femur (extra copy) = + ৳1,640', () => expect(q(FULL().map((p) => (p.k === 'femur' && p.s === 'R' ? { ...p, q: 2 } : p))).total).toBe(23500 + 1640))
  it('Half Set changed to Full Set: extras the Full Set already covers are not charged', () => {
    const halfPlus = add(HALF(), { k: 'femur', s: 'R' })
    expect(q(halfPlus).total).toBe(17860)
    expect(q(add(FULL(), { k: 'femur', s: 'R' }).map((p) => (p.k === 'femur' && p.s === 'R' ? { ...p, q: 1 } : p))).total).toBe(23500)
  })
  it('extra line amounts always add up to the total', () => {
    for (const pieces of [HALF(), FULL(), add(HALF(), { k: 'femur', s: 'R' }, { k: 'l1', s: 'S' }), add(FULL(), { k: 'pelvis', s: 'S' })]) {
      const r = q(pieces)
      expect(r.lines.reduce((a, l) => a + l.amount, 0)).toBe(r.total)
    }
  })
})

describe('safeguards S1–S8', () => {
  it('S1: a complete Full Set always gets the Full Set price, never the Half Set route', () => {
    // Half Set + every upgrade = the Full Set pieces.
    const half = HALF()
    const upgrades = FULL().filter((p) => !half.some((h) => h.k === p.k && h.s === p.s))
    const r = q(add(half, ...upgrades))
    expect(r.set).toBe('full')
    expect(r.total).toBe(23500)
  })
  it('S1: Full Set + add-ons use the Full Set saving (no smaller set undercuts it)', () => {
    const r = q(add(FULL(), { k: 'c3', s: 'S' }))
    expect(r.set).toBe('full')
    expect(r.total).toBe(23650)
  })
  it('S2: a pair is only cheaper when the pair price is above one side', () => {
    const cat = { ...CAT, items: CAT.items.map((i) => (i.key === 'foot' ? { ...i, full_price: 1550 } : i)) }
    expect(quote(cat, { pieces: [{ k: 'foot', s: 'L' }, { k: 'foot', s: 'R' }] }).total).toBe(3100)
  })
  it('S3: two pieces of the same side are not a pair', () => {
    expect(q([{ k: 'femur', s: 'L', q: 2 }]).total).toBe(3280)
    expect(q([{ k: 'femur', s: 'L' }, { k: 'femur', s: 'R' }]).total).toBe(3200)
  })
  it('S4: the assembled pelvis never completes a set and is charged on its own', () => {
    const noLoose = HALF().filter((p) => !['hip', 'sacrum', 'coccyx'].includes(p.k))
    const r = q(add(noLoose, { k: 'pelvis', s: 'S' }))
    expect(r.set).toBe(null)
    expect(q(add(HALF(), { k: 'pelvis', s: 'S' })).total).toBe(16300 + 4750)
  })
  it('S4: skull base products never stand in for the skull bones', () => {
    const noSkull = HALF().filter((p) => !['occipital', 'temporal', 'sphenoid', 'ethmoid', 'frontal', 'parietal'].includes(p.k))
    expect(q(add(noSkull, { k: 'base_vault', s: 'S' })).set).toBe(null)
  })
  it('S5: only builder pieces count (unknown keys are rejected)', () => {
    expect(q([{ k: 'femur-shop-product', s: 'S' }])).toMatchObject({ ok: false, error: 'unknown_item' })
  })
  it('S6: a set whose price is above its parts is never applied', () => {
    const cat = { ...CAT, bundles: CAT.bundles.map((b) => (b.key === 'half' ? { ...b, price: 99999 } : b)) }
    const r = quote(cat, { pieces: HALF() })
    expect(r.set).toBe(null)
    expect(r.total).toBe(17360)
  })
  it('S7/S8: prices sent by the browser are ignored', () => {
    const r = quote(CAT, { pieces: [{ k: 'femur', s: 'L', price: 1 }], total: 1, set: 'full' })
    expect(r.total).toBe(1640)
    expect(r.set).toBe(null)
  })
})

describe('validation and duplicates', () => {
  it('duplicate pieces are rejected', () => expect(q([{ k: 'femur', s: 'L' }, { k: 'femur', s: 'L' }])).toMatchObject({ ok: false, error: 'duplicate_piece' }))
  it('left/right on a midline bone is rejected', () => expect(q([{ k: 'mandible', s: 'L' }])).toMatchObject({ ok: false, error: 'invalid_side' }))
  it('a paired bone needs L or R', () => expect(q([{ k: 'femur', s: 'S' }])).toMatchObject({ ok: false, error: 'invalid_side' }))
  it('quantity must be a whole number 1..10', () => {
    for (const bad of [0, -1, 11, 1.5, '2']) expect(q([{ k: 'femur', s: 'L', q: bad }]).ok).toBe(false)
  })
  it('removing a set bone ends the set saving; the price is then the normal total', () => {
    expect(q(without(HALF(), 'femur', 'L')).total).toBe(17360 - 1640)
    expect(q(without(HALF(), 'ethmoid', 'S')).total).toBe(17360 - 100)
  })
  it('putting the bone back restores the set price', () => expect(q(add(without(HALF(), 'femur', 'L'), { k: 'femur', s: 'L' })).total).toBe(16300))
  it('bones picked one by one that make a whole set get the set price', () => {
    const singles = HALF().map((p) => (p.k === 'lumbar_any' ? [{ k: 'l1', s: 'S' }, { k: 'l2', s: 'S' }] : [p])).flat()
    expect(q(singles).total).toBe(16300)
  })
  it('never negative, empty is zero', () => {
    expect(q([]).total).toBe(0)
    expect(q(FULL()).total).toBeGreaterThan(0)
  })
})
