// Database tests for supabase/migration_hardening_1_revoke.sql and
// supabase/migration_hardening_2_rate_limits.sql.
//
// Runs against a throwaway LOCAL Postgres (never the real project):
//   PGHOST=/tmp PGPORT=5433 PGUSER=postgres node supabase/tests/hardening.test.mjs
// It creates a fresh database, loads a replica of the relevant live objects
// (supabase/tests/replica_schema.sql + the live function definitions taken
// from the migration files), proves the old exposure exists, applies the
// hardening migration twice (idempotency) and checks the new behaviour.
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const base = { host: process.env.PGHOST || '/tmp', port: Number(process.env.PGPORT || 5433), user: process.env.PGUSER || 'postgres' }
const DB = 'hardening_test'

const results = []
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`)

// Pull a "create or replace function public.<name>" block out of a migration.
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
  ['migration_invoices.sql', 'next_daily_seq'], ['migration_invoices.sql', 'gen_order_number'],
  ['migration_invoices.sql', 'gen_invoice_number'], ['migration_invoices.sql', 'build_invoice_for_order'],
  ['migration_orders.sql', 'create_customer_order'], ['migration_audit_fixes.sql', 'place_order'],
  ['migration_audit_fixes.sql', 'track_order'], ['migration_i18n_cancel.sql', 'cancel_my_order'],
]) await db.query(fn(file, name))
// Live grants before hardening (as in the migration files / pg_proc on the project).
await db.query(`
  alter table public.orders alter column order_number set default public.gen_order_number();
  grant execute on function public.create_customer_order(text, text, text, text, jsonb) to anon, authenticated;
  grant execute on function public.gen_order_number(), public.gen_invoice_number(), public.next_daily_seq(text) to anon, authenticated;
  grant execute on function public.track_order(text, text) to anon, authenticated;
  revoke all on function public.cancel_my_order(uuid) from public, anon; grant execute on function public.cancel_my_order(uuid) to authenticated;
  revoke all on function public.place_order(text, text, text, text, jsonb, text, text) from public; grant execute on function public.place_order(text, text, text, text, jsonb, text, text) to authenticated;
`)

// Run SQL as a PostgREST role with JWT claims, inside its own transaction.
const users = {}
async function as(role, sub, sql, args = [], email = '') {
  const c = new pg.Client({ ...base, database: DB }); await c.connect()
  try {
    await c.query('begin')
    await c.query(`set local role ${role}`)
    await c.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)`,
      [sub || '', JSON.stringify(sub ? { sub, email: email || `${sub.slice(0, 4)}@example.com` } : {})])
    const r = await c.query(sql, args); await c.query('commit'); return { ok: true, rows: r.rows }
  } catch (e) { await c.query('rollback').catch(() => {}); return { ok: false, err: e.message } } finally { await c.end() }
}
const uid = () => crypto.randomUUID()
const [P1, P2] = (await db.query(`insert into public.products (name, price, discount_percent, weight_kg) values ('Heart', 1000, 0, 0.25), ('Skull', 500, 10, 0.5) returning id`)).rows.map((r) => r.id)
const order = (u, items, txn = 'ABC12345') => as('authenticated', u,
  `select public.place_order('QA Customer', '01712345678', 'House 1, Road 2', '', $1::jsonb, $2, 'Mirpur, Dhaka') r`, [JSON.stringify(items), txn])

// ---- Before hardening: the exposure exists in the replica ----------------------
let r = await as('anon', '', `select public.create_customer_order('X', '01712345678', 'Addr', '', '[{"unit_price": 1, "qty": 1}]'::jsonb) r`)
ok('BEFORE: logged-out caller can create an order with its own price via create_customer_order', r.ok)
r = await as('anon', '', `select public.gen_order_number() r`)
ok('BEFORE: logged-out caller can consume order numbers', r.ok)

// ---- Apply the migration twice --------------------------------------------------
const mig = ['migration_hardening_1_revoke.sql', 'migration_hardening_2_rate_limits.sql'].map((f) => readFileSync(join(root, f), 'utf8')).join('\n')
try { await db.query(mig); await db.query(mig); ok('migration applies cleanly and is idempotent (ran twice)', true) }
catch (e) { ok('migration applies cleanly and is idempotent (ran twice)', false, e.message) }

// ---- Exposure closed ----------------------------------------------------------
r = await as('anon', '', `select public.create_customer_order('X', '01712345678', 'Addr', '', '[]'::jsonb) r`)
ok('anon can no longer call create_customer_order', !r.ok && /permission denied/.test(r.err), r.err)
r = await as('authenticated', uid(), `select public.create_customer_order('X', '01712345678', 'Addr', '', '[]'::jsonb) r`)
ok('customers can no longer call create_customer_order', !r.ok && /permission denied/.test(r.err), r.err)
r = await as('authenticated', uid(), `select public.build_invoice_for_order(gen_random_uuid())`)
ok('customers can no longer call build_invoice_for_order', !r.ok && /permission denied/.test(r.err), r.err)
r = await as('anon', '', `select public.gen_order_number() r`)
ok('anon can no longer call gen_order_number', !r.ok && /permission denied/.test(r.err), r.err)
r = await as('anon', '', `select * from private.rate_limits`)
ok('rate-limit table is not reachable from the API roles', !r.ok && /permission denied/.test(r.err), r.err)
r = await as('authenticated', uid(), `select private.rate_limit_hit('x', 999, interval '1 hour')`)
ok('rate-limit functions are not callable from the API roles', !r.ok && /permission denied/.test(r.err), r.err)
r = await as('authenticated', uid(), `insert into public.orders (customer_name) values ('Admin made') returning order_number`, [], 'admin@example.com')
ok('admin-panel style insert still gets an order number (column default works)', r.ok && /^3D-\d{8}-\d{3}$/.test(r.rows[0].order_number), r.err || r.rows[0].order_number)

// ---- Quantity / item validation ------------------------------------------------
const U = uid()
r = await order(U, [{ product_id: P1, quantity: 2 }, { product_id: P2, quantity: 1 }])
const o = r.ok && r.rows[0].r
ok('normal order works; subtotal computed by the database', r.ok && Number(o.cod) === 2 * 1000 + 450, r.err || JSON.stringify(o))
const lines = r.ok ? (await db.query('select quantity from order_items where order_id = $1 order by quantity', [o.order_id])).rows.map((x) => x.quantity) : []
ok('order_items stored with the requested quantities', JSON.stringify(lines) === '[1,2]', JSON.stringify(lines))
for (const [label, q] of [['zero', 0], ['negative', -3], ['fractional', 1.5], ['string', '5'], ['above 1000', 1001], ['huge', 1e12], ['boolean', true]]) {
  r = await order(uid(), [{ product_id: P1, quantity: q }])
  ok(`quantity ${label} (${JSON.stringify(q)}) rejected`, !r.ok && /INVALID_QUANTITY/.test(r.err), r.err)
}
r = await order(uid(), [{ product_id: P1, quantity: 1000 }])
ok('quantity 1000 (custom bulk amount) accepted', r.ok && Number(r.rows[0].r.cod) === 1000 * 1000, r.err)
r = await order(uid(), [{ product_id: P1 }])
ok('missing quantity defaults to 1 (unchanged behaviour)', r.ok && Number(r.rows[0].r.cod) === 1000, r.err)
r = await order(uid(), [{ product_id: 'not-a-uuid', quantity: 1 }])
ok('malformed product id rejected with a clear error', !r.ok && /INVALID_ITEMS/.test(r.err), r.err)
r = await order(uid(), Array.from({ length: 51 }, () => ({ product_id: P1, quantity: 1 })))
ok('more than 50 lines rejected', !r.ok && /INVALID_ITEMS/.test(r.err), r.err)
const before = (await db.query('select count(*)::int n from orders')).rows[0].n
r = await order(uid(), [{ product_id: P1, quantity: -1 }])
ok('rejected order leaves no partial rows', (await db.query('select count(*)::int n from orders')).rows[0].n === before)

// ---- Order rate limit -----------------------------------------------------------
const R = uid(); const res = []
for (let i = 0; i < 6; i++) res.push(await order(R, [{ product_id: P1, quantity: 1 }]))
ok('5 orders in 10 minutes allowed', res.slice(0, 5).every((x) => x.ok), res.find((x) => !x.ok)?.err)
ok('6th order in 10 minutes refused with RATE_LIMITED', !res[5].ok && /RATE_LIMITED/.test(res[5].err), res[5].err)
r = await order(uid(), [{ product_id: P1, quantity: 1 }])
ok('another customer is not affected', r.ok, r.err)
const F = uid()
for (let i = 0; i < 3; i++) await order(F, [{ product_id: P1, quantity: 0 }])
r = await order(F, [{ product_id: P1, quantity: 1 }])
const cnt = (await db.query(`select coalesce(sum(hits),0)::int n from private.rate_limits where bucket = $1`, ['order:' + F])).rows[0].n
ok('failed (invalid) orders are not counted against the limit', r.ok && cnt === 1, `hits=${cnt}`)

// Concurrency: 12 simultaneous orders from one customer -> exactly 5 succeed.
const C = uid()
const conc = await Promise.all(Array.from({ length: 12 }, () => order(C, [{ product_id: P1, quantity: 1 }])))
const okCount = conc.filter((x) => x.ok).length
ok('12 concurrent orders: exactly 5 accepted, 7 rate-limited', okCount === 5 && conc.filter((x) => /RATE_LIMITED/.test(x.err || '')).length === 7, `accepted=${okCount}`)

// ---- Cancel rate limit ------------------------------------------------------------
const K = uid()
const kOrder = (await order(K, [{ product_id: P1, quantity: 1 }])).rows[0].r.order_id
const cancels = []
for (let i = 0; i < 21; i++) cancels.push(await as('authenticated', K, 'select public.cancel_my_order($1) r', [kOrder]))
ok('first cancel works, repeats are safe no-ops', cancels[0].ok && cancels[0].rows[0].r.already === false && cancels[1].rows[0].r.already === true)
ok('21st cancel call in 10 minutes refused with RATE_LIMITED', cancels.slice(0, 20).every((x) => x.ok) && !cancels[20].ok && /RATE_LIMITED/.test(cancels[20].err), cancels[20].err)
const st = (await db.query('select status, cancelled_by from orders where id = $1', [kOrder])).rows[0]
ok('cancellation still recorded correctly', st.status === 'cancelled' && st.cancelled_by === 'customer')
r = await as('authenticated', uid(), 'select public.cancel_my_order($1) r', [kOrder])
ok("other customer still gets ORDER_NOT_FOUND (ownership unchanged)", !r.ok && /ORDER_NOT_FOUND/.test(r.err), r.err)

// ---- Tracking ----------------------------------------------------------------------
const T = (await db.query(`select order_number from orders where id = $1`, [o.order_id])).rows[0].order_number
r = await as('anon', '', 'select public.track_order($1, $2) r', [T, '01712345678'])
ok('logged-out tracking with correct number + phone still works', r.ok && r.rows[0].r?.order_number === T, r.err)
const tries = []
for (let i = 0; i < 10; i++) tries.push(await as('anon', '', 'select public.track_order($1, $2) r', [T, '0171234' + String(1000 + i)]))
ok('wrong-phone guesses return nothing (no data leak)', tries.slice(0, 9).every((x) => x.ok && x.rows[0].r === null))
ok('11th lookup for the same order number in 15 minutes refused', !tries[9].ok && /RATE_LIMITED/.test(tries[9].err), tries[9].err)
r = await as('anon', '', 'select public.track_order($1, $2) r', ['3D-20990101-001', '01712345678'])
ok('a different order number is not blocked', r.ok, r.err)

// ---- Public inserts (triggers) ------------------------------------------------------
const subs = []
for (const e of ['A@x.com', 'a@x.com', 'a@X.com', 'A@X.com']) subs.push(await as('anon', '', 'insert into public.subscribers (email) values ($1)', [e]))
ok('newsletter: 3 sign-ups per email per day, 4th refused', subs.slice(0, 3).every((x) => x.ok) && !subs[3].ok && /RATE_LIMITED/.test(subs[3].err), subs[3].err)
r = await as('anon', '', 'insert into public.subscribers (email) values ($1)', ['someone@else.com'])
ok('newsletter: other emails unaffected', r.ok, r.err)
const RV = uid(); const revs = []
for (let i = 0; i < 11; i++) revs.push(await as('authenticated', RV, `insert into public.comments (user_id, product_id, body, status) values ($1, $2, 'ok', 'pending')`, [RV, P1]))
ok('reviews: 10 per customer per hour, 11th refused', revs.slice(0, 10).every((x) => x.ok) && !revs[10].ok && /RATE_LIMITED/.test(revs[10].err), revs[10].err)
r = await as('anon', '', `insert into public.page_views (path) values ('/')`)
ok('anonymous page-view inserts still work under the cap', r.ok, r.err)
r = await as('anon', '', `insert into public.leads (product_id) values ('x')`)
ok('anonymous lead inserts still work under the cap', r.ok, r.err)

// ---- consume_rate_limit (used by the review-photo upload route) -----------------------
r = await as('anon', '', `select public.consume_rate_limit('review_photo')`)
ok('consume_rate_limit refuses logged-out callers', !r.ok && /permission denied/.test(r.err), r.err)
const PH = uid(); const photos = []
for (let i = 0; i < 11; i++) photos.push(await as('authenticated', PH, `select public.consume_rate_limit('review_photo')`))
ok('review photos: 10 per customer per hour, 11th refused', photos.slice(0, 10).every((x) => x.ok) && !photos[10].ok && /RATE_LIMITED/.test(photos[10].err), photos[10].err)
r = await as('authenticated', PH, `select public.consume_rate_limit('anything_else')`)
ok('unknown action names are refused', !r.ok && /UNKNOWN_ACTION/.test(r.err), r.err)

await db.end()
console.log(results.join('\n'))
const failed = results.filter((x) => x.startsWith('FAIL')).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
