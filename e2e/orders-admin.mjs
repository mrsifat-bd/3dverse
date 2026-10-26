import { chromium } from 'playwright'
import { readFileSync } from 'fs'
// Checkout, customer cancellation and admin flows against an in-memory FAKE
// Supabase backend (no real data is touched). The site must be built with
//   NEXT_PUBLIC_SUPABASE_URL=https://qafake.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=qa-anon
// and started; then  BASE_URL=http://localhost:3123 node e2e/orders-admin.mjs
import { fileURLToPath } from 'url'
import { dirname } from 'path'
const S = dirname(fileURLToPath(import.meta.url))
const OUT = S + '/out'
const B = process.env.BASE_URL || 'http://localhost:3123'
const SB = 'https://qafake.supabase.co'
const PNG = readFileSync(S + '/fixtures/photo-a.png')
const results = []
const ok = (n, c, x = '') => results.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`)

// ---------- in-memory fake backend ----------
const USER = { id: 'u-admin', aud: 'authenticated', role: 'authenticated', email: '3dverse.bd@gmail.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
const PRODUCT = { id: 'p-1', name: 'QA Heart Model', slug: 'qa-heart-model', price: 1000, cost: 300, description: 'QA product', category: 'bone-models', tags: ['qa'], image_url: [SB + '/storage/v1/object/public/product-images/old.webp'], in_stock: true, popular: false, discount: 0, weight_kg: 0.25, created_at: '2026-10-01T00:00:00Z' }
const db = {
  orders: [
    { id: 'o-1', order_number: '3D-20261018-001', customer_name: 'QA One', customer_phone: '01700000001', customer_address: 'Road 1, Sylhet', police_station: 'Sylhet Sadar, Sylhet', note: '', items: [{ product_id: 'p-1', name: 'QA Heart Model', slug: 'qa-heart-model', unit_price: 1000, qty: 1 }], status: 'new', payment_status: 'pending', delivery_charge: 70, discount: 0, weight_kg: 0.25, subtotal: 1000, total: 1070, cod_amount: 1000, created_at: '2026-10-18T05:00:00Z', steadfast_consignment_id: null, user_id: 'u-c' },
    { id: 'o-2', order_number: '3D-20261017-004', customer_name: 'QA Two', customer_phone: '01700000002', customer_address: 'Road 2, Dhaka', police_station: 'Mirpur, Dhaka', note: '', items: [{ product_id: 'p-1', name: 'QA Heart Model', slug: 'qa-heart-model', unit_price: 1000, qty: 2 }], status: 'confirmed', payment_status: 'verified', delivery_charge: 120, discount: 0, weight_kg: 0.5, subtotal: 2000, total: 2120, cod_amount: 2000, created_at: '2026-10-17T05:00:00Z', steadfast_consignment_id: null, user_id: 'u-c' },
  ],
  order_events: [], products: [PRODUCT], placed: [], productUpdates: [], uploads: 0, notifications: [],
}
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
const eqId = (u) => (u.searchParams.get('id') || '').replace(/^eq\./, '')

async function fake(route) {
  const req = route.request(); const u = new URL(req.url()); const p = u.pathname; const m = req.method()
  const wantsObj = /vnd\.pgrst\.object/.test(req.headers()['accept'] || '')
  const body = () => { try { return JSON.parse(req.postData() || '{}') } catch { return {} } }
  if (p.startsWith('/storage/v1/object/public/')) return route.fulfill({ status: 200, contentType: 'image/png', body: PNG })
  if (p === '/auth/v1/user') return json(route, USER)
  if (p.startsWith('/auth/v1/token')) return json(route, session())
  if (p.startsWith('/auth/v1/logout')) return route.fulfill({ status: 204 })
  if (p.startsWith('/rest/v1/rpc/')) {
    const fn = p.split('/').pop()
    if (fn === 'is_admin') return json(route, true)
    if (fn === 'admin_products') return json(route, db.products)
    if (fn === 'admin_product') return json(route, db.products.filter((x) => x.id === body().p_id))
    if (fn === 'cancel_my_order') {
      const o = db.orders.find((x) => x.id === body().p_order_id)
      if (!o || o.user_id !== USER.id) return json(route, { message: 'ORDER_NOT_FOUND', code: 'P0001' }, 400)
      if (o.status === 'cancelled') return json(route, { status: 'cancelled', already: true })
      if (o.status !== 'new' || o.payment_status === 'verified') return json(route, { message: 'NOT_CANCELLABLE', code: 'P0001' }, 400)
      Object.assign(o, { status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: 'customer' })
      db.order_events.push({ id: 'ev-' + db.order_events.length, created_at: new Date().toISOString(), order_id: o.id, type: 'status', message: 'Order cancelled by the customer before verification.' })
      if (!db.notifications.some((n) => n.order_id === o.id && n.type === 'customer_cancelled')) db.notifications.push({ order_id: o.id, type: 'customer_cancelled' })
      return json(route, { status: 'cancelled', already: false })
    }
    if (fn === 'admin_verify_delivery_payment' || fn === 'admin_reject_delivery_payment') {
      const o = db.orders.find((x) => x.id === body().p_order_id)
      if (!o) return json(route, { message: 'ORDER_NOT_FOUND', code: 'P0001' }, 400)
      if (o.status === 'cancelled') return json(route, { message: 'ORDER_CANCELLED', code: 'P0001' }, 400)
      if (fn === 'admin_verify_delivery_payment') Object.assign(o, { payment_status: 'verified', status: 'confirmed' })
      else o.payment_status = 'rejected'
      return json(route, null)
    }
    if (fn === 'place_order') {
      const b = body(); db.placed.push(b)
      const n = '3D-20261018-' + String(db.placed.length + 1).padStart(3, '0')
      db.orders.unshift({ id: 'o-new-' + db.placed.length, order_number: n, customer_name: b.p_name, customer_phone: b.p_phone, customer_address: b.p_address, police_station: b.p_police_station, note: b.p_note, items: [{ product_id: 'm2', name: 'QA', unit_price: 950, qty: 1 }], status: 'new', payment_status: 'pending', delivery_charge: 70, discount: 0, weight_kg: 0.2, subtotal: 950, total: 1020, cod_amount: 950, created_at: new Date().toISOString(), steadfast_consignment_id: null, user_id: USER.id })
      return json(route, { order_number: n, cod: 950, delivery: 70 })
    }
    return json(route, wantsObj ? {} : [])
  }
  if (p.startsWith('/rest/v1/')) {
    const table = p.split('/')[3]
    if (table === 'orders') {
      if (m === 'GET') { const id = eqId(u); const rows = id ? db.orders.filter((o) => o.id === id) : db.orders; return json(route, wantsObj ? rows[0] || null : rows) }
      if (m === 'PATCH') {
        const id = eqId(u); const patch = body(); const want = (u.searchParams.get('status') || '').replace(/^eq\./, '')
        const hit = db.orders.filter((o) => o.id === id && (!want || o.status === want))
        hit.forEach((o) => Object.assign(o, patch))
        return u.searchParams.get('select') ? json(route, hit.map((o) => ({ id: o.id }))) : route.fulfill({ status: 204 })
      }
    }
    if (table === 'order_events') {
      if (m === 'POST') { db.order_events.push({ id: 'ev-' + db.order_events.length, created_at: new Date().toISOString(), ...body() }); return route.fulfill({ status: 201 }) }
      return json(route, db.order_events.filter((e) => e.order_id === (u.searchParams.get('order_id') || '').replace(/^eq\./, '')))
    }
    if (table === 'products' && m === 'PATCH') { db.productUpdates.push(body()); return json(route, wantsObj ? { id: eqId(u) } : [{ id: eqId(u) }]) }
    if (table === 'cart_items' && m === 'GET') return json(route, [{ product_id: 'm2', quantity: 1, products: { id: 'm2', name: 'Human Heart Cross-Section Model', slug: 'human-heart-cross-section-model', price: 950, image_url: [SB + '/storage/v1/object/public/x.png'], in_stock: true, weight_kg: 0.2, discount: 0 } }])
    if (m === 'GET' || m === 'HEAD') return json(route, wantsObj ? null : [])
    return route.fulfill({ status: m === 'POST' ? 201 : 204 })
  }
  return json(route, {})
}
function session() {
  return { access_token: 'qa-token', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'qa-refresh', user: USER }
}

const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } })
await ctx.route(SB + '/**', fake)
await ctx.route(B + '/api/admin/product-images', async (route) => {
  db.uploads++
  await new Promise((r) => setTimeout(r, 300))
  json(route, { url: `${SB}/storage/v1/object/public/product-images/qa-upload-${db.uploads}.webp` })
})
await ctx.addInitScript((s) => { try { localStorage.setItem('sb-qafake-auth-token', JSON.stringify(s)); localStorage.setItem('sub_dismissed', '1') } catch {} }, session())
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 200)))
p.on('console', (msg) => { if (msg.type() === 'error' && !/ERR_|Failed to load resource|WebSocket|realtime/i.test(msg.text())) errs.push(msg.text().slice(0, 200)) })

// ---------- 1. Customer places an order ----------
await p.goto(B + '/checkout', { waitUntil: 'networkidle' })
await p.waitForTimeout(800)
ok('checkout: logged-in customer sees summary step', (await p.getByText('Continue to delivery details').count()) === 1)
await p.getByText('Continue to delivery details').click(); await p.waitForTimeout(400)
await p.fill('#name', 'QA Customer'); await p.fill('#phone', '01712345678'); await p.fill('#addr', 'House 1, Road 2, Zindabazar')
await p.click('button[aria-haspopup="listbox"]'); await p.waitForTimeout(200)
await p.keyboard.type('Sylhet Sadar'); await p.waitForTimeout(300)
await p.locator('[role="listbox"] button').first().click(); await p.waitForTimeout(200)
const thana = await p.locator('button[aria-haspopup="listbox"]').innerText()
ok('checkout: thana picked', /Sylhet/i.test(thana), thana.trim())
await p.getByText('Continue to payment').click(); await p.waitForTimeout(500)
ok('checkout: step 3 (bKash payment) shown', await p.locator('#txn').isVisible())
await p.fill('#txn', 'QA12345678'); await p.waitForTimeout(200)
await p.getByRole('button', { name: 'Confirm order' }).click()
await p.waitForURL('**/checkout/success**', { timeout: 10000 }).catch(() => {})
const succ = await p.locator('main').innerText().catch(() => '')
ok('order created: success page shows order number', p.url().includes('/checkout/success') && succ.includes('3D-20261018-002'), p.url().replace(B, ''))
ok('order created: backend received the right data', db.placed.length === 1 && db.placed[0].p_transaction_id === 'QA12345678' && /Sylhet/.test(db.placed[0].p_police_station) && db.placed[0].p_phone.endsWith('1712345678'), String(JSON.stringify(db.placed[0])).slice(0, 160))
await p.screenshot({ path: OUT + '/qa-success.png' })

// ---------- 2. Admin: orders list + status change ----------
await p.goto(B + '/admin/orders', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
let listed = 0; for (const n of ['3D-20261018-001','3D-20261017-004','3D-20261018-002']) listed += (await p.getByText(n, { exact: true }).count()) > 0 ? 1 : 0
ok('admin orders: all 3 orders listed (incl. the new one)', listed >= 3, String(listed))
await p.getByText('3D-20261018-001').first().click(); await p.waitForTimeout(700)
const sel = p.locator('select[aria-label="Order status"]').first()
ok('admin orders: order expands with status control', await sel.isVisible())
await sel.selectOption('shipped'); await p.waitForTimeout(800)
const o1 = db.orders.find((o) => o.id === 'o-1')
ok('status change saved to backend', o1.status === 'shipped', o1.status)
ok('status change logged as order event', db.order_events.some((e) => e.order_id === 'o-1' && /Shipped/.test(e.message)), JSON.stringify(db.order_events.at(-1) || {}))
ok('status change shown in UI', (await sel.inputValue()) === 'shipped')
await p.screenshot({ path: OUT + '/qa-orders.png' })
// failed save must roll back (never show a status the backend did not accept)
await ctx.route(SB + '/rest/v1/orders**', (r) => r.request().method() === 'PATCH' ? r.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"QA forced failure"}' }) : r.fallback())
await sel.selectOption('delivered'); await p.waitForTimeout(900)
ok('failed status save rolls back in UI', (await sel.inputValue()) === 'shipped' && db.orders.find((o) => o.id === 'o-1').status === 'shipped', await sel.inputValue())
await ctx.unroute(SB + '/rest/v1/orders**')

// ---------- 3. Admin: product image upload / replace / save ----------
await p.goto(B + '/admin/products', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
ok('admin products: list renders', (await p.getByText('QA Heart Model').count()) >= 1)
// Popular: badge + one-click star (writes ONLY is_popular) + "Popular only" filter.
ok('popular: no badge before marking', (await p.getByText('Popular', { exact: true }).count()) === 0)
const nUpd = db.productUpdates.length
await p.getByRole('button', { name: 'Mark QA Heart Model as popular' }).click(); await p.waitForTimeout(700)
const starBody = db.productUpdates[nUpd] || {}
ok('popular: star saves only is_popular=true', JSON.stringify(starBody) === '{"is_popular":true}', JSON.stringify(starBody))
ok('popular: badge shown after marking', (await p.getByText('Popular', { exact: true }).count()) === 1)
await p.screenshot({ path: OUT + '/qa-popular.png' })
await p.getByRole('button', { name: /Popular only \(1\)/ }).click(); await p.waitForTimeout(300)
ok('popular: filter keeps the popular product', (await p.getByText('QA Heart Model').count()) === 1)
await p.getByRole('button', { name: 'Remove QA Heart Model from popular' }).click(); await p.waitForTimeout(700)
ok('popular: star again saves is_popular=false', JSON.stringify(db.productUpdates.at(-1)) === '{"is_popular":false}', JSON.stringify(db.productUpdates.at(-1)))
ok('popular: filter now empty with hint', (await p.getByText(/No popular products yet/).count()) === 1)
await p.getByRole('button', { name: /Popular only/ }).click()
db.productUpdates.length = nUpd
await p.goto(B + '/admin/products/p-1', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
ok('edit form: existing image shown', (await p.locator('button[aria-label="Replace image"]').count()) === 1)
await p.locator('input[type=file][multiple]').setInputFiles(S + '/fixtures/photo-a.png')
await p.waitForTimeout(1500)
let thumbs = await p.locator('button[aria-label="Replace image"]').count()
ok('upload: new image added (2 images)', thumbs === 2, String(thumbs))
const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.locator('button[aria-label="Replace image"]').nth(1).click()])
await chooser.setFiles(S + '/fixtures/photo-b.png'); await p.waitForTimeout(1500)
thumbs = await p.locator('button[aria-label="Replace image"]').count()
ok('replace: still 2 images after replacing one', thumbs === 2, String(thumbs))
const shimmerLeft = await p.locator('.img-loading').count()
ok('image loading shimmer cleared after load', shimmerLeft === 0, String(shimmerLeft))
await p.screenshot({ path: OUT + '/qa-images.png' })
await p.getByRole('button', { name: 'Save changes' }).click()
await p.waitForURL('**/admin/products', { timeout: 8000 }).catch(() => {})
const saved = db.productUpdates.at(-1)?.image_url || []
ok('save: product saved with upload-1 as main and old image replaced by upload-2', saved.length === 2 && /qa-upload-1/.test(saved[0]) && /qa-upload-2/.test(saved[1]) && !saved.some((u) => /old\.webp/.test(u)), JSON.stringify(saved))
ok('save: returned to product list', p.url().endsWith('/admin/products'))
// ---------- 4. Customer cancels before verification (+ admin consistency) ----------
const newId = db.orders.find((o) => o.order_number === '3D-20261018-002')?.id
db.orders.find((o) => o.id === 'o-2').user_id = USER.id
db.orders.push({ ...db.orders.find((o) => o.id === newId), id: 'o-race', order_number: '3D-20261018-009' })
const admin = await ctx.newPage()   // admin screen opened BEFORE the customer cancels (stale view)
admin.on('pageerror', (e) => errs.push('admin pageerror: ' + e.message.slice(0, 200)))
await admin.goto(B + '/admin/orders', { waitUntil: 'networkidle' }); await admin.waitForTimeout(1000)

await p.goto(B + '/account/orders', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
const row = (n) => p.locator('div.rounded-2xl').filter({ has: p.locator('button[aria-expanded]', { hasText: n }) })
await row('3D-20261017-004').locator('button[aria-expanded]').click(); await p.waitForTimeout(500)
ok('verified order: no Cancel button', (await row('3D-20261017-004').getByRole('button', { name: 'Cancel order' }).count()) === 0)
await row('3D-20261018-002').locator('button[aria-expanded]').click(); await p.waitForTimeout(500)
const cancelBtn = row('3D-20261018-002').getByRole('button', { name: 'Cancel order' })
ok('pending order: Cancel button visible', await cancelBtn.isVisible())
await cancelBtn.click(); await p.waitForTimeout(400)
const dlg = p.locator('[role="alertdialog"]')
ok('confirm dialog opens with focus on "Keep order"', (await dlg.count()) === 1 && (await p.evaluate(() => document.activeElement?.textContent?.trim())) === 'Keep order')
await p.keyboard.press('Escape'); await dlg.waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})  // page is a background tab here, so rAF runs slowly
ok('Escape closes dialog without cancelling', (await dlg.count()) === 0 && db.orders.find((o) => o.id === newId).status === 'new', `dialogs=${await dlg.count()} status=${db.orders.find((o) => o.id === newId).status}`)
ok('focus returns to the Cancel button', (await p.evaluate(() => document.activeElement?.textContent?.trim())) === 'Cancel order', await p.evaluate(() => document.activeElement?.textContent?.trim()))
await cancelBtn.click(); await p.waitForTimeout(300)
await p.getByRole('button', { name: 'Yes, cancel order' }).dblclick().catch(() => {}); await p.waitForTimeout(1200)
const no = db.orders.find((o) => o.id === newId)
ok('customer cancel saved: status cancelled, by customer', no.status === 'cancelled' && no.cancelled_by === 'customer', no.status)
ok('payment status untouched (no refund/payment change)', no.payment_status === 'pending')
ok('one admin notification + one event despite double click', db.notifications.filter((n) => n.order_id === newId).length === 1 && db.order_events.filter((e) => e.order_id === newId).length === 1)
ok('success message announced (role=status)', /has been cancelled/.test(await p.locator('[role="status"]').first().innerText().catch(() => '')))
ok('order shows "You cancelled this order"', (await p.getByText('You cancelled this order').count()) >= 1)
ok('order still listed (never deleted)', (await p.getByText('3D-20261018-002').count()) >= 1)

// race: customer UI still says "new" but admin verified meanwhile
await row('3D-20261018-009').locator('button[aria-expanded]').click(); await p.waitForTimeout(400)
Object.assign(db.orders.find((o) => o.id === 'o-race'), { payment_status: 'verified', status: 'confirmed' })
await row('3D-20261018-009').getByRole('button', { name: 'Cancel order' }).click(); await p.waitForTimeout(300)
await p.getByRole('button', { name: 'Yes, cancel order' }).click(); await p.waitForTimeout(1200)
ok('cancel after admin verification is refused', db.orders.find((o) => o.id === 'o-race').status === 'confirmed')
ok('customer told it is too late (role=alert)', /already been verified/.test(await p.locator('div[role="alert"]').first().innerText().catch(() => '')))
ok('screen refreshed to the real status (button gone)', (await row('3D-20261018-009').getByRole('button', { name: 'Cancel order' }).count()) === 0)

// Bangla version of the same page
await p.goto(B + '/bn/account/orders', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
const bnTxt = await p.locator('main').innerText()
ok('bn orders page: Bangla status + Bangla digits', /বাতিল/.test(bnTxt) && /[০-৯]/.test(bnTxt))

// stale admin screen: status change on the order the customer cancelled
await admin.getByText('3D-20261018-002').first().click(); await admin.waitForTimeout(800)
const asel = admin.locator('select[aria-label="Order status"]').first()
await asel.selectOption('confirmed'); await admin.waitForTimeout(1500)
ok('stale admin status change cannot undo the customer cancel', db.orders.find((o) => o.id === newId).status === 'cancelled')
ok('admin told the order changed', (await admin.getByText(/changed elsewhere/).count()) >= 1)
ok('admin list shows "Cancelled by customer"', (await admin.getByText(/Cancelled by customer/i).count()) >= 1)
await admin.screenshot({ path: OUT + '/qa-admin-cancelled.png' })
await admin.close()

ok('no console errors during the whole flow', errs.length === 0, errs.join(' | '))
console.log(results.join('\n'))
console.log('ERRS', errs)
const failed = results.filter((x) => x.startsWith('FAIL')).length
console.log(`\n${results.length - failed}/${results.length} passed`)
await b.close()
process.exit(failed ? 1 : 0)
