// Skeleton Builder end-to-end test against an in-memory FAKE Supabase backend
// (no real data is touched, no real order is created). Build and start the site with
//   NEXT_PUBLIC_SUPABASE_URL=https://qafake.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=qa-anon
// then  BASE_URL=http://localhost:3123 node e2e/skeleton.mjs
// The fake prices builder lines with src/lib/skeleton/pricing.js; the real
// database function is proven equal to it in supabase/tests/skeleton.dbcheck.mjs.
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { mkdirSync } from 'fs'
import { SKELETON_CATALOG as CAT } from '../src/lib/skeleton/catalog.js'
import { quote } from '../src/lib/skeleton/pricing.js'

const S = dirname(fileURLToPath(import.meta.url))
const OUT = S + '/out/skeleton'; mkdirSync(OUT, { recursive: true })
const B = process.env.BASE_URL || 'http://localhost:3123'
const SB = 'https://qafake.supabase.co'
const results = []
const ok = (n, c, x = '') => results.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`)
const USER = { id: 'u-cust', aud: 'authenticated', role: 'authenticated', email: 'qa.customer@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
const ADMIN = { ...USER, id: 'u-admin', email: '3dverse.bd@gmail.com' }
const session = (u) => ({ access_token: 'qa-token-' + u.id, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'qa-refresh', user: u })
const dbCatalog = { items: CAT.items, bundles: CAT.bundles.map((b) => ({ ...b, items: b.items })) }
const state = { ready: false, carts: {}, placed: [], quotes: 0 }

function fakeFor(user) {
  return async (route) => {
    const req = route.request(); const u = new URL(req.url()); const p = u.pathname; const m = req.method()
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    const body = () => { try { return JSON.parse(req.postData() || '{}') } catch { return {} } }
    const wantsObj = /vnd\.pgrst\.object/.test(req.headers()['accept'] || '')
    if (p === '/auth/v1/user') return user ? json(user) : json({ message: 'no session' }, 401)
    if (p.startsWith('/auth/v1/token')) return json(session(user || USER))
    if (p.startsWith('/rest/v1/rpc/')) {
      const fn = p.split('/').pop()
      if (fn === 'skeleton_catalog') return json(dbCatalog)
      if (fn === 'skeleton_quote') { state.quotes++; return json(quote(CAT, body().p_config || {})) }
      if (fn === 'skeleton_checkout_ready') return state.ready ? json(true) : json({ message: 'function public.skeleton_checkout_ready() does not exist', code: 'PGRST202' }, 404)
      if (fn === 'is_admin') return json(user?.email === ADMIN.email)
      if (fn === 'place_order') {
        const b = body(); state.placed.push(b)
        const sk = (b.p_items || []).find((i) => i.kind === 'skeleton')
        const q = sk ? quote(CAT, sk.config) : { total: 0 }
        return json({ order_number: '3D-20261106-001', order_id: 'o-sk', cod: q.total, delivery: 120 })
      }
      return json(wantsObj ? {} : [])
    }
    if (p.startsWith('/rest/v1/')) {
      const table = p.split('/')[3]
      if (table === 'skeleton_carts') {
        const id = user?.id
        if (m === 'GET') return json(wantsObj ? (state.carts[id] ? { config: state.carts[id] } : null) : (state.carts[id] ? [{ config: state.carts[id] }] : []))
        if (m === 'POST') { const r = body(); state.carts[r.user_id] = r.config; return route.fulfill({ status: 201, body: '' }) }
        if (m === 'DELETE') { delete state.carts[id]; return route.fulfill({ status: 204 }) }
      }
      if (table === 'skeleton_change_log') return json([])
      return json(wantsObj ? null : [])
    }
    return route.fulfill({ status: 200, body: '' })
  }
}

const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
async function context(user, viewport = { width: 1366, height: 900 }, extra = {}) {
  const ctx = await browser.newContext({ viewport, ...extra })
  await ctx.route(SB + '/**', fakeFor(user))
  await ctx.addInitScript(([s]) => { try { if (s) localStorage.setItem('sb-qafake-auth-token', JSON.stringify(s)); localStorage.setItem('sub_dismissed', '1') } catch {} }, [user ? session(user) : null])
  return ctx
}
const money = (n) => '৳' + n.toLocaleString('en-IN')
const total = async (p) => (await p.locator('aside').getByText(/^৳[\d,]+$/).last().textContent())?.trim()
const errorsOf = (p) => { const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource|csp|ERR_FAILED/i.test(m.text())) errs.push(m.text()) }); return errs }
const row = (p, name) => p.locator('section[aria-label="Sections"] li').filter({ has: p.getByText(name, { exact: true }) }).first()

// ---------- Desktop, guest -------------------------------------------------------
let ctx = await context(null)
let p = await ctx.newPage(); let errs = errorsOf(p)
const t0 = Date.now()
await p.goto(B + '/skeleton-builder', { waitUntil: 'domcontentloaded' })
ok('page: H1 "3D Skeleton Builder"', (await p.locator('h1').textContent()).includes('3D Skeleton Builder'))
const html = await p.content()
ok('SEO: bone names and prices are in the HTML (crawlable)', /Femur/.test(html) && /Hyoid Bone/.test(html) && /Atypical Rib 11/.test(html))
ok('SEO: canonical + hreflang', /rel="canonical" href="[^"]*\/skeleton-builder"/.test(html) && /hreflang="bn"/i.test(html))
ok('SEO: JSON-LD Product offers for both sets', /"price":"16300"/.test(html) && /"price":"23500"/.test(html))
ok('credit line is on the page', /Z-Anatomy/.test(html) && /CC BY-SA 4.0/.test(html))
await p.waitForSelector('canvas', { timeout: 30000 }).catch(() => {})
await p.waitForFunction(() => !document.body.innerText.includes('Loading the 3D skeleton'), null, { timeout: 60000 }).catch(() => {})
ok('3D viewer: canvas rendered and model loaded', (await p.locator('canvas').count()) === 1 && !(await p.getByText('Loading the 3D skeleton').count()), `${Date.now() - t0} ms`)
const glb = await p.evaluate(() => performance.getEntriesByType('resource').filter((e) => /skeleton-(hi|lo)\.glb/.test(e.name)).map((e) => e.name.split('/').pop()))
ok('desktop loads the detailed model only', glb.length === 1 && glb[0] === 'skeleton-hi.glb', glb.join(','))
await p.screenshot({ path: OUT + '/1-desktop-empty.png' })

ok('empty total is ৳0', (await total(p)) === money(0))
await row(p, 'Femur').getByRole('button', { name: /Femur, Left/ }).click()
ok('Femur left = ৳1,640', (await total(p)) === money(1640))
await row(p, 'Femur').getByRole('button', { name: /Femur, Right/ }).click()
ok('change side to right keeps ৳1,640', (await total(p)) === money(1640))
await row(p, 'Femur').getByRole('button', { name: /Femur, Both sides/ }).click()
ok('Femur pair = ৳3,200', (await total(p)) === money(3200))
await row(p, 'Hyoid Bone').getByRole('button', { name: /Add Hyoid Bone/ }).click()
ok('Hyoid ৳180 (3,200 + 180)', (await total(p)) === money(3380))
await row(p, 'Mandible').getByRole('button', { name: /Add Mandible/ }).click()
ok('Mandible ৳350 added', (await total(p)) === money(3730))
ok('midline bones have no left/right buttons', (await row(p, 'Mandible').getByRole('button', { name: /Left/ }).count()) === 0)
await row(p, 'Hyoid Bone').getByRole('button', { name: /Remove Hyoid Bone/ }).click()
ok('deselect Hyoid', (await total(p)) === money(3550))
await p.getByRole('button', { name: /Complete Half Set/ }).first().click()
ok('choosing a set with bones already picked asks first', (await p.getByRole('dialog').count()) === 1)
await p.getByRole('button', { name: 'Keep as extras' }).click()
ok('Half Set + femur pair kept as extra = 16,300 + 1,560', (await total(p)) === money(17860), await total(p))
await p.getByRole('button', { name: /Complete Half Set/ }).first().click()
await p.getByRole('button', { name: 'Replace' }).click().catch(() => {})
ok('Half Set alone = ৳16,300', (await total(p)) === money(16300), await total(p))
await p.screenshot({ path: OUT + '/2-desktop-half-set.png' })
await p.getByRole('button', { name: 'Right', exact: true }).first().click()
ok('Half Set side switched to Right still ৳16,300', (await total(p)) === money(16300))
await p.getByRole('button', { name: /See what is included/ }).click()
const incHalf = await p.locator('aside ul li').allTextContents()
ok('Half Set lists its bones incl. 2 lumbar vertebrae (we choose)', incHalf.some((x) => /Femur · Right/.test(x)) && incHalf.some((x) => /Any lumbar vertebra.*×2/.test(x)), incHalf.slice(0, 5).join(' | '))
await p.getByRole('button', { name: /Complete Full Set/ }).first().click()
await p.getByRole('button', { name: 'Replace' }).click().catch(() => {})
ok('Full Set = ৳23,500', (await total(p)) === money(23500), await total(p))
await p.getByRole('button', { name: /See what is included/ }).click().catch(() => {})
const incFull = await p.locator('aside ul li').allTextContents()
ok('Full Set has both legs: femur, tibia, fibula, patella, foot left and right',
  ['Femur', 'Tibia', 'Fibula', 'Patella', 'Foot Bones'].every((n) => incFull.some((x) => x === `${n} · Left`) && incFull.some((x) => x === `${n} · Right`)), incFull.filter((x) => /Femur|Foot/.test(x)).join(' | '))
await p.screenshot({ path: OUT + '/3-desktop-full-set.png' })
await row(p, 'Pelvis Articulated').getByRole('button', { name: /Add Pelvis Articulated/ }).click()
ok('assembled pelvis is a separate product: 23,500 + 4,750', (await total(p)) === money(28250), await total(p))
await row(p, 'Pelvis Articulated').getByRole('button', { name: /Remove Pelvis Articulated/ }).click()
await row(p, 'Ethmoid').getByRole('button', { name: /Remove Ethmoid/ }).click()
ok('removing a set bone ends the set price (normal prices: 29,470 − 100)', (await total(p)) === money(29370), await total(p))
ok('the builder offers to complete the set again', (await p.getByText(/to complete the Complete Full Set/).count()) >= 1)
await row(p, 'Ethmoid').getByRole('button', { name: /Add Ethmoid/ }).click()
ok('putting it back restores ৳23,500', (await total(p)) === money(23500))
await row(p, 'C3 Vertebra (typical cervical)').getByRole('button', { name: /Add C3/ }).click()
ok('Full Set + C3 = ৳23,650', (await total(p)) === money(23650))

// 3D click: tap the femur area of the front view; the bone card must open.
const box = await p.locator('canvas').boundingBox()
let picked = ''
for (const [fx, fy] of [[0.555, 0.66], [0.56, 0.64], [0.55, 0.68], [0.565, 0.62]]) {
  await p.mouse.click(box.x + box.width * fx, box.y + box.height * fy)
  await p.waitForTimeout(400)
  picked = (await p.locator('[role="region"]').first().textContent().catch(() => '')) || ''
  if (picked) break
}
ok('3D: tapping a bone opens its card (name, section, side, prices, status)', /Section/.test(picked) && /Status/.test(picked), picked.slice(0, 90))
await p.screenshot({ path: OUT + '/4-desktop-bone-card.png' })

// Add to cart -> cart page -> reload.
await p.getByRole('button', { name: /Add to cart/ }).first().click()
await p.getByText('Added to your cart.').first().waitFor({ timeout: 8000 }).catch(() => {})
ok('add to cart: server quote checked, confirmation shown', (await p.getByText('Added to your cart.').count()) >= 1 && state.quotes > 0)
await p.goto(B + '/cart', { waitUntil: 'networkidle' })
ok('cart shows the builder line with the set and extras', (await p.getByText(/Interactive Skeleton Builder — Complete Full Set/).count()) === 1 && (await p.getByText(/C3 Vertebra/).count()) >= 1)
ok('cart line price ৳23,650', (await p.getByText(money(23650)).count()) >= 1)
await p.reload({ waitUntil: 'networkidle' })
ok('reload keeps the builder configuration (re-priced by the server)', (await p.getByText(/Interactive Skeleton Builder — Complete Full Set/).count()) === 1 && (await p.getByText(money(23650)).count()) >= 1)
await p.screenshot({ path: OUT + '/5-cart.png', fullPage: true })
// Tampering in the browser: change the stored price; the cart must show the server price.
await p.evaluate(() => { const c = JSON.parse(localStorage.getItem('3dv_cart') || '[]'); for (const l of c) if (l.kind === 'skeleton') { l.price = 1; l.quote = { lines: [] } } localStorage.setItem('3dv_cart', JSON.stringify(c)) })
await p.reload({ waitUntil: 'networkidle' })
ok('a price edited in the browser is replaced by the server price', (await p.getByText(money(23650)).count()) >= 1 && (await p.getByText(/^৳1$/).count()) === 0)
ok('no page errors on builder and cart (desktop)', errs.length === 0, errs.slice(0, 3).join(' | '))
await ctx.close()

// ---------- Logged-in: saved cart, checkout gating, order payload -----------------
ctx = await context(USER)
p = await ctx.newPage(); errs = errorsOf(p)
state.carts[USER.id] = { pieces: [{ k: 'femur', s: 'L' }, { k: 'femur', s: 'R' }, { k: 'mandible', s: 'S' }] }
await p.goto(B + '/cart', { waitUntil: 'networkidle' })
ok('signed-in cart loads the saved builder selection (৳3,550)', (await p.getByText(/Interactive Skeleton Builder/).count()) === 1 && (await p.getByText(money(3550)).count()) >= 1)
await p.goto(B + '/checkout', { waitUntil: 'networkidle' })
ok('before launch the checkout keeps builder orders closed', (await p.getByText(/Skeleton builder orders open very soon/).count()) >= 1)
state.ready = true
await p.reload({ waitUntil: 'networkidle' })
ok('after launch the notice is gone', (await p.getByText(/Skeleton builder orders open very soon/).count()) === 0)
ok('checkout summary shows the builder breakdown', (await p.getByText(/Femur · Left/).count()) + (await p.getByText(/Femur/).count()) >= 1)
await p.getByText('Continue to delivery details').click(); await p.waitForTimeout(400)
await p.fill('#name', 'QA Customer'); await p.fill('#phone', '01712345678'); await p.fill('#addr', 'House 1, Road 2, Zindabazar')
await p.click('button[aria-haspopup="listbox"]'); await p.waitForTimeout(200)
await p.keyboard.type('Sylhet Sadar'); await p.waitForTimeout(300)
await p.locator('[role="listbox"] button').first().click(); await p.waitForTimeout(200)
await p.getByText('Continue to payment').click(); await p.waitForTimeout(500)
await p.fill('#txn', 'QA12345678'); await p.waitForTimeout(200)
await p.getByRole('button', { name: 'Confirm order' }).click()
await p.waitForTimeout(2500)
const sent = state.placed.at(-1)
const skItem = sent && sent.p_items.find((i) => i.kind === 'skeleton')
ok('order payload sends only the configuration (no price, no total)', Boolean(skItem) && !('price' in skItem) && !('unit_price' in skItem) && skItem.config.pieces.length === 3, JSON.stringify(sent?.p_items || 'not placed'))
await ctx.close()

// ---------- Mobile ---------------------------------------------------------------------
ctx = await context(null, { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
p = await ctx.newPage(); errs = errorsOf(p)
await p.goto(B + '/skeleton-builder', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('canvas', { timeout: 30000 }).catch(() => {})
await p.waitForFunction(() => !document.body.innerText.includes('Loading the 3D skeleton'), null, { timeout: 60000 }).catch(() => {})
const glbM = await p.evaluate(() => performance.getEntriesByType('resource').filter((e) => /skeleton-(hi|lo)\.glb/.test(e.name)).map((e) => e.name.split('/').pop()))
ok('mobile loads the light model', glbM.length === 1 && glbM[0] === 'skeleton-lo.glb', glbM.join(','))
ok("mobile: no horizontal scroll (layout stays 390 px wide)", await p.evaluate(() => window.innerWidth === 390 && document.documentElement.scrollWidth <= 391))
await p.getByRole('button', { name: /Complete Full Set/ }).first().tap()
ok('mobile: sticky bar shows the Full Set price', (await p.locator('.fixed.bottom-0').getByText(money(23500)).count()) === 1)
await p.screenshot({ path: OUT + '/6-mobile-full-set.png' })
await p.getByRole('button', { name: 'Review' }).tap()
ok('mobile: summary sheet opens', (await p.getByRole('dialog', { name: 'Your selection' }).count()) === 1)
await p.screenshot({ path: OUT + '/7-mobile-summary.png' })
await p.getByRole('dialog', { name: 'Your selection' }).getByRole('button', { name: 'Close' }).first().tap()
ok('no page errors (mobile)', errs.length === 0, errs.slice(0, 3).join(' | '))
await ctx.close()

// ---------- Bangla ---------------------------------------------------------------------
ctx = await context(null)
p = await ctx.newPage()
await p.goto(B + '/bn/skeleton-builder', { waitUntil: 'domcontentloaded' })
ok('Bangla page: Bangla title and bone names', (await p.locator('h1').textContent()).includes('স্কেলেটন বিল্ডার') && (await p.getByText('ফিমার', { exact: true }).count()) >= 1)
ok('Bangla page: Bangla prices', (await p.getByText(/৳১৬,৩০০/).count()) >= 1)
await p.screenshot({ path: OUT + '/8-bangla.png' })
await ctx.close()

// ---------- Admin ----------------------------------------------------------------------
ctx = await context(ADMIN)
p = await ctx.newPage()
await p.goto(B + '/admin/skeleton', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
ok('admin: Skeleton Builder page lists sets and bones', (await p.getByText('Complete Full Set').count()) >= 1 && (await p.locator('table tbody tr').count()) > 50)
ok('admin: prices are locked behind "Change price"', (await p.getByRole('button', { name: /Change price/ }).count()) === 2)
await p.screenshot({ path: OUT + '/9-admin.png', fullPage: true })
await ctx.close()

await browser.close()
console.log(results.join('\n'))
const failed = results.filter((r) => r.startsWith('FAIL')).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
