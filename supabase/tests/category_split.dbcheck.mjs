// Tests the Medical / Bones category split SQL on a throwaway LOCAL Postgres:
//   PGHOST=/tmp PGPORT=5433 PGUSER=postgres node supabase/tests/category_split.dbcheck.mjs
// The fixture mirrors the live shop (Nov 2026): 71 products in the old
// category (11 of them Medical), the other categories, a product with an extra
// category, orders that point at products. Checks apply -> cleanup -> rollback.
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { MEDICAL_PRODUCT_SLUGS, OLD_CATEGORY } from '../../src/lib/categorySplit.js'

const here = dirname(fileURLToPath(import.meta.url))
const sql = (f) => readFileSync(join(here, '..', f), 'utf8')
const base = { host: process.env.PGHOST || '/tmp', port: Number(process.env.PGPORT || 5433), user: process.env.PGUSER || 'postgres' }
const DB = 'category_split_test'
const results = []
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra && !cond ? ' — ' + extra : ''}`)

const s = new pg.Client({ ...base, database: 'postgres' }); await s.connect()
await s.query(`drop database if exists ${DB}`); await s.query(`create database ${DB}`); await s.end()
const db = new pg.Client({ ...base, database: DB }); await db.connect()
const one = async (q, a) => (await db.query(q, a)).rows[0]

await db.query(`
  do $$ begin if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if; end $$;
  create table public.categories (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null,
    blurb text, status text not null default 'active', sort int default 0, created_at timestamptz default now(), name_bn text);
  create table public.products (id uuid primary key default gen_random_uuid(), name text not null, slug text unique, price numeric not null,
    description text, category text, category_id uuid references public.categories(id), extra_categories text[] not null default '{}',
    image_url text, in_stock boolean default true, status text default 'active', created_at timestamptz default now());
  create table public.order_items (id uuid primary key default gen_random_uuid(), product_id uuid references public.products(id), unit_price_snapshot numeric);
  insert into public.categories (name, slug, sort) values ('Medical & Bone Models', '${OLD_CATEGORY}', 1), ('Pen Holder', 'pen-holder', 0),
    ('Home Decor', 'home-decor', 5), ('Wall Decoration', 'wall-decoration', 0), ('Gifts', 'gifts', 6);
`)
// 71 products in the old category: the 11 Medical ones + 60 bones; 38 of the
// live products have category_id set, so half of these do too.
const oldSlugs = [...MEDICAL_PRODUCT_SLUGS, ...Array.from({ length: 60 }, (_, i) => `bone-${i + 1}`)]
let n = 0
for (const slug of oldSlugs) {
  n++
  await db.query(`insert into public.products (name, slug, price, description, category, category_id, image_url)
    values ($1, $1, $2, 'desc ' || $1, $3, case when $4 then (select id from public.categories where slug = $3) end, 'img-' || $1)`,
  [slug, 100 + n, OLD_CATEGORY, n % 2 === 0])
}
await db.query(`insert into public.products (name, slug, price, category, extra_categories) values
  ('Pen A', 'pen-a', 500, 'pen-holder', '{}'), ('Family Wall Art', 'custom-family-wall-art', 420, 'home-decor', '{wall-decoration}'),
  ('Doctor Gift', 'doctor-gift', 300, 'gifts', '{${OLD_CATEGORY}}')`)
await db.query(`insert into public.order_items (product_id, unit_price_snapshot) select id, price from public.products where slug in ('bone-1', 'human-heart', 'pen-a')`)

const fingerprint = async () => (await one(`select md5(string_agg(id || ':' || name || ':' || slug || ':' || price || ':' || coalesce(description, '') || ':' || coalesce(image_url, '') || ':' || in_stock || ':' || status, ',' order by id)) f, count(*) n from public.products`))
const state = async () => (await one(`select md5(string_agg(id || ':' || coalesce(category, '') || ':' || coalesce(category_id::text, '') || ':' || array_to_string(extra_categories, '+'), ',' order by id)) f from public.products`)).f
const orders = async () => (await one(`select md5(string_agg(product_id || ':' || unit_price_snapshot, ',' order by id)) f from public.order_items`)).f
const before = { fp: await fingerprint(), state: await state(), orders: await orders() }
const count = async (where) => Number((await one(`select count(*) c from public.products where ${where}`)).c)

// --- Part 1 ---
await db.query(sql('migration_category_split_1_apply.sql'))
ok('part 1: 11 Medical products', (await count(`category = 'medical'`)) === 11)
ok('part 1: 60 Bones products', (await count(`category = 'bones'`)) === 60)
ok('part 1: nothing left with the old main category', (await count(`category = '${OLD_CATEGORY}'`)) === 0)
ok('part 1: old page still works (old slug kept as extra)', (await count(`'${OLD_CATEGORY}' = any(extra_categories)`)) === 72)
ok('part 1: extra-category product also in Bones', (await count(`slug = 'doctor-gift' and extra_categories @> '{bones}' and category = 'gifts'`)) === 1)
ok('part 1: every Medical slug is Medical', (await count(`slug = any($1::text[]) and category = 'medical'`.replace('$1::text[]', `array[${MEDICAL_PRODUCT_SLUGS.map((x) => `'${x}'`).join(',')}]`))) === 11)
ok('part 1: category_id follows the new category', (await count(`category in ('medical','bones') and category_id is not null and category_id <> (select id from public.categories c where c.slug = products.category)`)) === 0
  && (await count(`category in ('medical','bones') and category_id is not null`)) === 35)
ok('part 1: products without category_id keep it empty', (await count(`category in ('medical','bones') and category_id is null`)) === 36)
ok('part 1: no product duplicated, nothing else changed', JSON.stringify(await fingerprint()) === JSON.stringify(before.fp))
ok('part 1: other categories untouched', (await count(`category = 'pen-holder'`)) === 1 && (await count(`slug = 'custom-family-wall-art' and extra_categories = '{wall-decoration}'`)) === 1)
ok('part 1: orders untouched', (await orders()) === before.orders)
const cats = (await db.query(`select slug, name, name_bn, status from public.categories where slug in ('medical','bones') order by slug`)).rows
ok('part 1: Medical/Bones categories with Bangla names, active', cats.length === 2 && cats[0].name_bn === 'হাড়' && cats[1].name_bn === 'মেডিকেল' && cats.every((c) => c.status === 'active'))
ok('part 1: backup has the 72 touched products', Number((await one(`select count(*) c from public.category_split_backup_20261106`)).c) === 72)

// Running part 1 twice must not double anything.
let again = true
try { await db.query(sql('migration_category_split_1_apply.sql')) } catch { again = false }
ok('part 1 twice: no duplicate extra categories', !again || (await count(`array_length(extra_categories, 1) > (select count(distinct x) from unnest(extra_categories) x)`)) === 0)

// --- Part 2 ---
await db.query(sql('migration_category_split_2_cleanup.sql'))
ok('part 2: old slug removed from every product', (await count(`'${OLD_CATEGORY}' = any(extra_categories)`)) === 0)
ok('part 2: old category inactive (kept, not deleted)', (await one(`select status from public.categories where slug = '${OLD_CATEGORY}'`)).status === 'inactive')
ok('part 2: extra Bones on the gift product kept', (await count(`slug = 'doctor-gift' and extra_categories = '{bones}'`)) === 1)
ok('part 2: still no product changed otherwise', JSON.stringify(await fingerprint()) === JSON.stringify(before.fp) && (await orders()) === before.orders)

// --- Rollback ---
await db.query(sql('rollback_category_split.sql'))
ok('rollback: every product exactly as before', (await state()) === before.state)
ok('rollback: old category active again', (await one(`select status from public.categories where slug = '${OLD_CATEGORY}'`)).status === 'active')
ok('rollback: Medical/Bones inactive', (await count(`true`)) === 74 && Number((await one(`select count(*) c from public.categories where slug in ('medical','bones') and status = 'inactive'`)).c) === 2)
ok('rollback: products and orders unchanged', JSON.stringify(await fingerprint()) === JSON.stringify(before.fp) && (await orders()) === before.orders)

// --- A failed check undoes everything ---
await db.query(`update public.products set category = 'pen-holder' where slug = 'human-heart'`) // only 10 Medical left
const pre = await state()
let refused = false
try { await db.query(sql('migration_category_split_1_apply.sql')) } catch (e) { refused = /expected 11 Medical/.test(e.message) }
await db.query('rollback').catch(() => {})
ok('part 1 stops and changes nothing when the Medical count is off', refused && (await state()) === pre)

await db.end()
console.log(results.join('\n'))
const failed = results.filter((r) => r.startsWith('FAIL')).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
