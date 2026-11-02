// Database tests for supabase/migration_categories_customers.sql.
// Throwaway LOCAL Postgres only (never the real project):
//   PGHOST=/tmp PGPORT=5433 PGUSER=postgres node supabase/tests/categories_customers.dbcheck.mjs
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const here = dirname(fileURLToPath(import.meta.url))
const base = { host: process.env.PGHOST || '/tmp', port: Number(process.env.PGPORT || 5433), user: process.env.PGUSER || 'postgres' }
const DB = 'cats_customers_test'
const results = []
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`)

const setup = new pg.Client({ ...base, database: 'postgres' }); await setup.connect()
await setup.query(`drop database if exists ${DB}`); await setup.query(`create database ${DB}`); await setup.end()
const db = new pg.Client({ ...base, database: DB }); await db.connect()

// Minimal replica of the live objects this migration touches.
await db.query(`
  create extension if not exists pgcrypto;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  end $$;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}',
    email_confirmed_at timestamptz, created_at timestamptz default now(), last_sign_in_at timestamptz, encrypted_password text);
  create or replace function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  create table public.admin_emails (email text primary key);
  insert into public.admin_emails values ('3dverse.bd@gmail.com');
  create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
    $$ select exists (select 1 from public.admin_emails where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))) $$;
  create table public.categories (id uuid primary key default gen_random_uuid(), name text, slug text unique, blurb text, sort int default 0, status text default 'active');
  create table public.products (id uuid primary key default gen_random_uuid(), name text, slug text, category text, status text default 'active', production_cost numeric, model_source_url text);
  -- live style: column-level SELECT grants that exclude private columns
  grant select (id, name, slug, category, status) on public.products to anon, authenticated;
  create table public.profiles (user_id uuid primary key, full_name text not null default '', phone text not null default '');
  create table public.orders (id uuid primary key default gen_random_uuid(), user_id uuid, created_at timestamptz default now());
  insert into public.categories (name, slug) values ('Medical & Bone Models','medical-bone-models'), ('Gifts','gifts'), ('Desk','desk-accessories');
  insert into public.products (name, slug, category) values ('Skull','skull','medical-bone-models'), ('Doctor Key Ring','doctor-key-ring','medical-bone-models'), ('Pen','pen','desk-accessories');
  insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at, last_sign_in_at, encrypted_password) values
    ('11111111-1111-1111-1111-111111111111','rony@example.com','{"full_name":"Rony"}', now(), now(), 'secret-hash'),
    ('22222222-2222-2222-2222-222222222222','new@example.com','{}', null, null, 'secret-hash');
  insert into public.profiles values ('11111111-1111-1111-1111-111111111111','Md Rony','01754797399');
  insert into public.orders (user_id) values ('11111111-1111-1111-1111-111111111111'), ('11111111-1111-1111-1111-111111111111');
`)

async function as(role, email, sql) {
  const c = new pg.Client({ ...base, database: DB }); await c.connect()
  try {
    await c.query('begin'); await c.query(`set local role ${role}`)
    await c.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(email ? { email } : {})])
    const r = await c.query(sql); await c.query('commit'); return { rows: r.rows }
  } catch (e) { await c.query('rollback').catch(() => {}); return { error: e.message } } finally { await c.end() }
}

const mig = readFileSync(join(here, '..', 'migration_categories_customers.sql'), 'utf8')
await db.query(mig)
await db.query(mig) // idempotent
ok('migration runs twice without error', true)

const col = await db.query(`select data_type, column_default, is_nullable from information_schema.columns where table_name='products' and column_name='extra_categories'`)
ok('extra_categories exists, not null, defaults to empty list', col.rows[0]?.data_type === 'ARRAY' && col.rows[0]?.is_nullable === 'NO' && /'\{\}'/.test(col.rows[0]?.column_default || ''), JSON.stringify(col.rows[0]))
const existing = await db.query(`select count(*)::int n from public.products where extra_categories = '{}'`)
ok('existing products unchanged (empty extra list)', existing.rows[0].n === 3)

const anonRead = await as('anon', '', `select slug, extra_categories from public.products`)
ok('anon (public shop) can read extra_categories', !anonRead.error && anonRead.rows.length === 3, anonRead.error || '')
const anonCost = await as('anon', '', `select production_cost from public.products`)
ok('anon still cannot read production_cost', Boolean(anonCost.error))

await db.query(`update public.products set extra_categories = '{gifts}' where slug = 'doctor-key-ring'`)
const ranked = await as('anon', '', `select slug, product_count from public.public_categories_ranked()`)
const cnt = Object.fromEntries((ranked.rows || []).map((r) => [r.slug, Number(r.product_count)]))
ok('ranking counts extra categories (Gifts = 1)', cnt.gifts === 1, JSON.stringify(cnt))
ok('ranking still counts main category (Medical = 2, Desk = 1)', cnt['medical-bone-models'] === 2 && cnt['desk-accessories'] === 1, JSON.stringify(cnt))
const inGifts = await as('anon', '', `select slug from public.products where category = 'gifts' or 'gifts' = any(extra_categories)`)
ok('product shows in its extra category', (inGifts.rows || []).map((r) => r.slug).join() === 'doctor-key-ring')

const adm = await as('authenticated', '3dverse.bd@gmail.com', `select * from public.admin_customers()`)
ok('admin sees registered customers', !adm.error && adm.rows.length === 2, adm.error || String(adm.rows.length))
const rony = (adm.rows || []).find((r) => r.email === 'rony@example.com') || {}
ok('customer row has name (profile first), phone, orders', rony.full_name === 'Md Rony' && rony.phone === '01754797399' && Number(rony.order_count) === 2 && rony.email_confirmed === true, JSON.stringify(rony))
const fresh = (adm.rows || []).find((r) => r.email === 'new@example.com') || {}
ok('unconfirmed account with no orders shown', fresh.email_confirmed === false && Number(fresh.order_count) === 0)
ok('no password or token fields returned', adm.rows && !Object.keys(adm.rows[0]).some((k) => /password|token|meta/i.test(k)), Object.keys(adm.rows?.[0] || {}).join(','))
const cust = await as('authenticated', 'rony@example.com', `select * from public.admin_customers()`)
ok('non-admin customer is refused', /NOT_ADMIN/.test(cust.error || ''), cust.error || 'allowed!')
const anon = await as('anon', '', `select * from public.admin_customers()`)
ok('anon is refused', /permission denied/.test(anon.error || ''), anon.error || 'allowed!')

await db.end()
console.log(results.join('\n'))
const failed = results.filter((r) => r.startsWith('FAIL')).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
