// Database tests for the Skeleton Builder migrations
// (supabase/migration_skeleton_1_tables.sql, supabase/migration_skeleton_2_checkout.sql).
// Runs against a throwaway LOCAL Postgres only:
//   PGHOST=/tmp PGPORT=5433 PGUSER=postgres node supabase/tests/skeleton.dbcheck.mjs
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { SKELETON_CATALOG as CAT, ITEMS } from '../../src/lib/skeleton/catalog.js'
import { quote, piecesForSet, mergePieces } from '../../src/lib/skeleton/pricing.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const base = { host: process.env.PGHOST || '/tmp', port: Number(process.env.PGPORT || 5433), user: process.env.PGUSER || 'postgres' }
const DB = 'skeleton_test'
const results = []
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra && !cond ? ' — ' + extra : ''}`)
function fn(file, name) {
  const s = readFileSync(join(root, file), 'utf8')
  const m = s.match(new RegExp(`create or replace function public\\.${name}\\b[\\s\\S]*?\\$\\$;`, 'i'))
  if (!m) throw new Error(`${name} not found in ${file}`)
  return m[0]
}

const setup = new pg.Client({ ...base, database: 'postgres' }); await setup.connect()
await setup.query(`drop database if exists ${DB}`); await setup.query(`create database ${DB}`); await setup.end()
const db = new pg.Client({ ...base, database: DB }); await db.connect()
await db.query(readFileSync(join(here, 'replica_schema.sql'), 'utf8'))
for (const [file, name] of [
  ['migration_audit_fixes.sql', 'is_sylhet_city'], ['migration_audit_fixes.sql', 'compute_delivery_charge_zone'],
  ['migration_invoices.sql', 'next_daily_seq'], ['migration_invoices.sql', 'gen_order_number'], ['migration_audit_fixes.sql', 'place_order'],
]) await db.query(fn(file, name))
await db.query(`alter table public.orders alter column order_number set default public.gen_order_number();
  revoke all on function public.place_order(text, text, text, text, jsonb, text, text) from public;
  grant execute on function public.place_order(text, text, text, text, jsonb, text, text) to authenticated;`)

async function as(role, sub, sql, args = [], email = '') {
  const c = new pg.Client({ ...base, database: DB }); await c.connect()
  try {
    await c.query('begin'); await c.query(`set local role ${role}`)
    await c.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)`,
      [sub || '', JSON.stringify(sub ? { sub, email: email || `${sub.slice(0, 4)}@example.com` } : {})])
    const r = await c.query(sql, args); await c.query('commit'); return { ok: true, rows: r.rows }
  } catch (e) { await c.query('rollback').catch(() => {}); return { ok: false, err: e.message } } finally { await c.end() }
}
const uid = () => crypto.randomUUID()
const newUser = async () => { const id = uid(); await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${id.slice(0, 4)}@example.com`]); return id }
const [P1] = (await db.query(`insert into public.products (name, price, discount_percent, weight_kg) values ('Heart', 1000, 0, 0.25) returning id`)).rows.map((r) => r.id)
const order = (u, items, txn = 'ABC12345') => as('authenticated', u,
  `select public.place_order('QA Customer', '01712345678', 'House 1, Road 2', '', $1::jsonb, $2, 'Mirpur, Dhaka') r`, [JSON.stringify(items), txn])

// ---- Part 1 -------------------------------------------------------------------
const m1 = readFileSync(join(root, 'migration_skeleton_1_tables.sql'), 'utf8')
try { await db.query(m1); await db.query(m1); ok('part 1 applies cleanly and is idempotent (ran twice)', true) } catch (e) { ok('part 1 applies cleanly', false, e.message) }
const nItems = (await db.query('select count(*)::int n from public.skeleton_items')).rows[0].n
ok('seed: every catalogue item is in the database', nItems === ITEMS.length, `${nItems} vs ${ITEMS.length}`)
const dbItems = (await db.query('select key, half_price::float h, full_price::float f, kind, is_active from public.skeleton_items')).rows
ok('seed prices equal the catalogue (all items)', ITEMS.every((i) => { const d = dbItems.find((x) => x.key === i.key); return d && d.h === i.half_price && (i.full_price === null ? d.f === null : d.f === i.full_price) && d.kind === i.kind }))
const sets = (await db.query('select key, price::float p from public.skeleton_bundles order by key')).rows
ok('set prices: Full ৳23,500, Half ৳16,300', JSON.stringify(sets) === JSON.stringify([{ key: 'full', p: 23500 }, { key: 'half', p: 16300 }]), JSON.stringify(sets))
ok('Hyoid is ৳180 in the database', dbItems.find((x) => x.key === 'hyoid').h === 180)

// Before part 2: the old place_order ignores a builder line, so the frontend must
// not send one yet (it checks skeleton_checkout_ready, which does not exist).
let U = await newUser()
let r = await order(U, [{ kind: 'skeleton', config: { pieces: [{ k: 'femur', s: 'L' }] } }])
ok('BEFORE part 2: a cart with only a builder line cannot become an order', !r.ok && /No valid products/.test(r.err), r.err)
r = await as('anon', '', 'select public.skeleton_checkout_ready() r')
ok('BEFORE part 2: skeleton_checkout_ready is not available (frontend keeps builder checkout closed)', !r.ok)

// ---- Server pricing equals the browser engine -----------------------------------
async function sqlQuote(pieces) { return (await db.query('select public.skeleton_quote($1::jsonb) q', [JSON.stringify({ pieces })])).rows[0].q }
const HALF = piecesForSet(CAT, 'half', 'L'); const FULL = piecesForSet(CAT, 'full')
const cases = {
  half: HALF, half_right: piecesForSet(CAT, 'half', 'R'), full: FULL,
  half_femur_pair: mergePieces([...HALF, { k: 'femur', s: 'R' }]),
  half_second_foot: mergePieces([...HALF, { k: 'foot', s: 'R' }]),
  half_lumbars: mergePieces([...HALF, ...['l1', 'l2', 'l3', 'l4', 'l5'].map((k) => ({ k, s: 'S' }))]),
  full_thoracic: mergePieces([...FULL, ...[1, 2, 3, 6, 7, 8, 9, 10, 11, 12].map((n) => ({ k: `th${n}`, s: 'S' }))]),
  full_pelvis: mergePieces([...FULL, { k: 'pelvis', s: 'S' }]),
  half_minus_femur: HALF.filter((p) => !(p.k === 'femur')),
  half_minus_ethmoid: HALF.filter((p) => p.k !== 'ethmoid'),
  half_upgraded_all: mergePieces([...HALF, ...FULL]).map((p) => ({ ...p, q: 1 })),
  singles_make_half: HALF.flatMap((p) => (p.k === 'lumbar_any' ? [{ k: 'l1', s: 'S' }, { k: 'l2', s: 'S' }] : [p])),
  femur_left_x2: [{ k: 'femur', s: 'L', q: 2 }], femur_pair: [{ k: 'femur', s: 'L' }, { k: 'femur', s: 'R' }],
  feet_pair: [{ k: 'foot', s: 'L' }, { k: 'foot', s: 'R' }], hyoid: [{ k: 'hyoid', s: 'S' }], pelvis: [{ k: 'pelvis', s: 'S' }],
  empty: [],
}
// Random selections too.
const listed = ITEMS.filter((i) => i.is_active && i.listed)
let seed = 7; const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n }
for (let n = 0; n < 60; n++) {
  const base = rnd(3) === 0 ? HALF : rnd(2) ? FULL : []
  const extra = Array.from({ length: rnd(8) }, () => { const it = listed[rnd(listed.length)]; return { k: it.key, s: it.kind === 'paired' ? (rnd(2) ? 'L' : 'R') : 'S', q: 1 + rnd(2) } })
  cases[`random_${n}`] = mergePieces([...base, ...extra])
}
let same = 0; const diffs = []
for (const [name, pieces] of Object.entries(cases)) {
  const js = quote(CAT, { pieces }); const sq = await sqlQuote(pieces)
  const eq = js.ok === sq.ok && js.total === Number(sq.total) && (js.set || null) === (sq.set || null) && Math.abs(js.weight_kg - Number(sq.weight_kg)) < 1e-9
    && js.lines.reduce((a, l) => a + l.amount, 0) === sq.lines.reduce((a, l) => a + Number(l.amount), 0)
  if (eq) same++; else diffs.push(`${name}: js ${js.total}/${js.set} sql ${sq.total}/${sq.set}`)
}
ok(`server price equals browser price for ${Object.keys(cases).length} selections (incl. 60 random)`, same === Object.keys(cases).length, diffs.slice(0, 5).join('; '))
ok('Half Set ৳16,300 on the server', Number((await sqlQuote(HALF)).total) === 16300)
ok('Full Set ৳23,500 on the server, both legs', Number((await sqlQuote(FULL)).total) === 23500 && (await sqlQuote(FULL)).lines.filter((l) => l.key === 'femur').length === 2)
for (const [label, pieces, err] of [
  ['unknown bone id', [{ k: 'nope', s: 'S' }], 'unknown_item'],
  ['left/right on a midline bone', [{ k: 'mandible', s: 'L' }], 'invalid_side'],
  ['missing side on a paired bone', [{ k: 'femur', s: 'S' }], 'invalid_side'],
  ['duplicate piece', [{ k: 'femur', s: 'L' }, { k: 'femur', s: 'L' }], 'duplicate_piece'],
  ['quantity 0', [{ k: 'femur', s: 'L', q: 0 }], 'invalid_qty'], ['quantity 11', [{ k: 'femur', s: 'L', q: 11 }], 'invalid_qty'],
  ['fractional quantity', [{ k: 'femur', s: 'L', q: 1.5 }], 'invalid_qty'], ['string quantity', [{ k: 'femur', s: 'L', q: '2' }], 'invalid_qty'],
  ['unavailable Manubrium', [{ k: 'manubrium', s: 'S' }], 'unavailable_item'],
]) { const s = await sqlQuote(pieces); ok(`server rejects ${label}`, s.ok === false && s.error === err, JSON.stringify(s)) }
r = await as('anon', '', `select public.skeleton_quote('{"pieces":[{"k":"femur","s":"L","price":1}],"total":1}'::jsonb) q`)
ok('anon can get a quote; a price sent by the browser is ignored', r.ok && Number(r.rows[0].q.total) === 1640, r.err)
r = await as('anon', '', 'select public.skeleton_catalog() c')
ok('anon can read the public catalogue', r.ok && r.rows[0].c.items.length === ITEMS.length && r.rows[0].c.bundles.length === 2, r.err)

// ---- Protected prices / admin ------------------------------------------------------
r = await as('authenticated', uid(), `update public.skeleton_items set half_price = 1 where key = 'femur'`)
ok('customer cannot change a price', !r.ok, r.err)
r = await as('authenticated', uid(), `update public.skeleton_items set half_price = 1 where key = 'femur'`, [], 'admin@example.com')
ok('admin cannot change a price with a plain update either (protected)', !r.ok, r.err)
r = await as('authenticated', uid(), `update public.skeleton_items set name_bn = 'ফিমার (টেস্ট)' where key = 'femur' returning key`, [], 'admin@example.com')
ok('admin can edit names', r.ok && r.rows.length === 1, r.err)
r = await as('authenticated', uid(), `select public.admin_skeleton_set_price('item', 'femur', 1700, 3300, 'test')`)
ok('customer cannot call the admin price function', !r.ok && /NOT_ADMIN/.test(r.err), r.err)
r = await as('anon', '', `select public.admin_skeleton_set_price('item', 'femur', 1700, 3300, 'test')`)
ok('anon cannot call the admin price function', !r.ok, r.err)
r = await as('authenticated', uid(), `select public.admin_skeleton_set_price('item', 'femur', 1700, 3300, '')`, [], 'admin@example.com')
ok('admin price change needs a reason', !r.ok && /REASON_REQUIRED/.test(r.err), r.err)
r = await as('authenticated', uid(), `select public.admin_skeleton_set_price('item', 'femur', 1700, 3300, 'QA test')`, [], 'admin@example.com')
const logged = (await db.query(`select count(*)::int n from public.skeleton_change_log where what = 'item:femur:price'`)).rows[0].n
ok('admin price change through the function works and is logged', r.ok && logged === 1, r.err)
await db.query(`select set_config('skeleton.price_change', 'allowed', false); update public.skeleton_items set half_price = 1640, full_price = 3200 where key = 'femur'; select set_config('skeleton.price_change', '', false)`)
r = await as('authenticated', uid(), `insert into public.skeleton_bundle_items (bundle, item_key, mode) values ('half', 'c3', 'single')`, [], 'admin@example.com')
ok('set contents cannot be changed with a plain insert', !r.ok, r.err)
r = await as('anon', '', `select * from public.skeleton_change_log`)
ok('change log is hidden from the public', !r.ok || r.rows.length === 0, r.err)

// ---- Saved builder cart (RLS) --------------------------------------------------------
const A = await newUser(); const B = await newUser()
r = await as('authenticated', A, `insert into public.skeleton_carts (user_id, config) values ($1, '{"pieces":[]}') returning user_id`, [A])
ok('customer can save their own builder selection', r.ok, r.err)
r = await as('authenticated', B, `select * from public.skeleton_carts`)
ok('another customer cannot see it', r.ok && r.rows.length === 0, r.err)
r = await as('authenticated', B, `insert into public.skeleton_carts (user_id, config) values ($1, '{"pieces":[]}')`, [A])
ok('nobody can write into another customer’s builder cart', !r.ok, r.err)

// ---- Part 2: checkout -------------------------------------------------------------
const m2 = readFileSync(join(root, 'migration_skeleton_2_checkout.sql'), 'utf8')
try { await db.query(m2); await db.query(m2); ok('part 2 applies cleanly and is idempotent', true) } catch (e) { ok('part 2 applies cleanly', false, e.message) }
r = await as('anon', '', 'select public.skeleton_checkout_ready() r')
ok('skeleton_checkout_ready is on after part 2', r.ok && r.rows[0].r === true, r.err)

U = await newUser()
r = await order(U, [{ product_id: P1, quantity: 2 }])
ok('normal product orders are unchanged (2 × ৳1,000)', r.ok && Number(r.rows[0].r.cod) === 2000, r.err)

U = await newUser()
await db.query(`insert into public.skeleton_carts (user_id, config) values ($1, '{"pieces":[]}')`, [U])
r = await order(U, [{ product_id: P1, quantity: 1 }, { kind: 'skeleton', config: { pieces: HALF }, price: 1, unit_price: 1, total: 1 }])
const o = r.ok && r.rows[0].r
ok('mixed order: builder Half Set ৳16,300 + product ৳1,000; browser prices ignored', r.ok && Number(o.cod) === 17300, r.err || JSON.stringify(o))
if (o) {
  const it = (await db.query(`select product_id, unit_price_snapshot::float p, quantity, config_snapshot from public.order_items where order_id = $1 and config_snapshot is not null`, [o.order_id])).rows[0]
  ok('builder order line saved with a full price snapshot', it && it.product_id === null && it.p === 16300 && it.quantity === 1 && it.config_snapshot.quote.set === 'half' && it.config_snapshot.config.pieces.length === HALF.length)
  const ord = (await db.query(`select items, weight_kg::float w from public.orders where id = $1`, [o.order_id])).rows[0]
  const sk = ord.items.find((i) => i.kind === 'skeleton')
  ok('orders.items carries readable builder details', sk && sk.details.length > 30 && /Complete Half Set — ৳16,300/.test(sk.details[0]) && sk.details.some((d) => /Included: Femur \(Left\)/.test(d)), JSON.stringify(sk && sk.details.slice(0, 3)))
  ok('order weight = Half Set product weight + the heart', Math.abs(ord.w - (2.797 + 0.25)) < 1e-9, String(ord.w))
  ok('saved builder cart is cleared after the order', (await db.query('select count(*)::int n from public.skeleton_carts where user_id = $1', [U])).rows[0].n === 0)
}
U = await newUser()
r = await order(U, [{ kind: 'skeleton', config: { pieces: FULL } }])
ok('Full Set order charged ৳23,500 (both legs)', r.ok && Number(r.rows[0].r.cod) === 23500, r.err)
U = await newUser()
r = await order(U, [{ kind: 'skeleton', config: { pieces: mergePieces([...HALF, { k: 'pelvis', s: 'S' }]) } }])
ok('Half Set + assembled pelvis charged separately: ৳21,050', r.ok && Number(r.rows[0].r.cod) === 21050, r.err)
for (const [label, items] of [
  ['tampered unknown bone', [{ kind: 'skeleton', config: { pieces: [{ k: 'femur', s: 'L' }, { k: 'gold-bone', s: 'S' }] } }]],
  ['invalid side', [{ kind: 'skeleton', config: { pieces: [{ k: 'sacrum', s: 'L' }] } }]],
  ['duplicate pieces', [{ kind: 'skeleton', config: { pieces: [{ k: 'femur', s: 'L' }, { k: 'femur', s: 'L' }] } }]],
  ['empty selection', [{ kind: 'skeleton', config: { pieces: [] } }]],
  ['missing config', [{ kind: 'skeleton' }]],
  ['two builder lines', [{ kind: 'skeleton', config: { pieces: HALF } }, { kind: 'skeleton', config: { pieces: HALF } }]],
]) {
  const before = (await db.query('select count(*)::int n from orders')).rows[0].n
  r = await order(await newUser(), items)
  ok(`checkout rejects ${label} and leaves no order`, !r.ok && (await db.query('select count(*)::int n from orders')).rows[0].n === before, r.err)
}
r = await as('anon', '', `select public.place_order('X', '01712345678', 'Addr', '', '[{"kind":"skeleton","config":{"pieces":[{"k":"femur","s":"L"}]}}]'::jsonb, 'ABC12345', 'Mirpur, Dhaka')`)
ok('logged-out caller cannot order', !r.ok, r.err)

// Same customer submitting twice quickly: two separate, correctly priced orders
// (no shared state is corrupted).
U = await newUser()
const [x1, x2] = await Promise.all([order(U, [{ kind: 'skeleton', config: { pieces: HALF } }]), order(U, [{ kind: 'skeleton', config: { pieces: HALF } }])])
ok('two parallel submissions are each priced correctly', x1.ok && x2.ok && Number(x1.rows[0].r.cod) === 16300 && Number(x2.rows[0].r.cod) === 16300, x1.err || x2.err)

await db.end()
const s2 = new pg.Client({ ...base, database: 'postgres' }); await s2.connect(); await s2.query(`drop database if exists ${DB}`); await s2.end()
console.log(results.join('\n'))
const failed = results.filter((x) => x.startsWith('FAIL')).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
