import { chromium } from 'playwright'
// Medical / Bones category split + navbar (demo-mode build, no Supabase needed).
// Usage: start the built site, then  BASE_URL=http://localhost:3123 node e2e/categories.mjs
// Screenshots: e2e/out/categories/
import { mkdirSync } from 'fs'
const B = process.env.BASE_URL || 'http://localhost:3123'
const OUT = new URL('./out/categories/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const results = []
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra && !cond ? ' — ' + extra : ''}`)
const ignore = /ERR_TUNNEL|Failed to load resource|placehold\.co|WebGL|GPU stall|GroupMarkerNotSet/
async function page(vp = { width: 1366, height: 900 }) {
  const ctx = await b.newContext({ viewport: vp })
  await ctx.route(/placehold\.co|google|facebook/, (r) => r.abort())
  const p = await ctx.newPage()
  p.errs = []
  p.on('pageerror', (e) => p.errs.push(e.message.slice(0, 160)))
  p.on('console', (m) => { if (m.type() === 'error' && !ignore.test(m.text())) p.errs.push(m.text().slice(0, 160)) })
  return p
}
const navLabels = (p, sel) => p.$$eval(sel, (as) => as.map((a) => [a.textContent.trim(), a.getAttribute('href')]))

// 1. Navbar, English + Bangla, desktop
let p = await page()
await p.goto(B + '/', { waitUntil: 'networkidle' })
let nav = await navLabels(p, 'header nav[aria-label] a')
ok('navbar EN: Home | Shop | Bones | About | Contact', JSON.stringify(nav) === JSON.stringify([['Home', '/'], ['Shop', '/shop'], ['Bones', '/category/bones'], ['About', '/about'], ['Contact', '/contact']]), JSON.stringify(nav))
await p.screenshot({ path: OUT + '1-navbar-en.png', clip: { x: 0, y: 0, width: 1366, height: 80 } })
await p.goto(B + '/bn', { waitUntil: 'networkidle' })
nav = await navLabels(p, 'header nav[aria-label] a')
ok('navbar BN: হোম | শপ | হাড় | আমাদের কথা | যোগাযোগ', JSON.stringify(nav.map((x) => x[0])) === JSON.stringify(['হোম', 'শপ', 'হাড়', 'আমাদের কথা', 'যোগাযোগ']) && nav[2][1] === '/bn/category/bones', JSON.stringify(nav))
await p.screenshot({ path: OUT + '2-navbar-bn.png', clip: { x: 0, y: 0, width: 1366, height: 80 } })
ok('no console errors (home)', p.errs.length === 0, p.errs.join(' | '))
await p.context().close()

// 2. Mobile menu
p = await page({ width: 390, height: 844 })
await p.goto(B + '/', { waitUntil: 'networkidle' })
await p.getByRole('button', { name: /open menu/i }).click(); await p.waitForTimeout(400)
const mob = await p.$$eval('header a', (as) => as.filter((a) => a.offsetParent && a.closest('[class*="md:hidden"], .md\\:hidden') ).map((a) => a.textContent.trim()))
ok('mobile menu shows Bones, not the old items', mob.includes('Bones') && !mob.some((x) => /Medical & Bone|Skeleton Builder/.test(x)), JSON.stringify(mob))
await p.screenshot({ path: OUT + '3-mobile-menu.png' })
await p.getByRole('link', { name: 'Bones', exact: true }).last().click(); await p.waitForURL('**/category/bones')
ok('mobile menu Bones opens the Bones category', p.url().endsWith('/category/bones'))
await p.screenshot({ path: OUT + '4-mobile-bones.png', fullPage: false })
await p.context().close()

// 3. Bones category
p = await page()
let r = await p.goto(B + '/category/bones', { waitUntil: 'networkidle' })
ok('/category/bones is 200', r.status() === 200)
ok('Bones heading', (await p.locator('h1').textContent()).trim() === 'Bones')
const card = p.locator('section[aria-labelledby="builder-feature-title"]')
ok('builder feature card on Bones (once)', (await card.count()) === 1)
ok('builder card title + CTA to the existing builder', /Build Your Own Human Skeleton/.test(await card.textContent()) && (await card.locator('a').getAttribute('href')) === '/skeleton-builder')
ok('builder card shows the set prices from the catalogue', /16,300/.test(await card.textContent()) && /23,500/.test(await card.textContent()))
const bonesProducts = await p.$$eval('main a[href^="/product/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))])
ok('Bones lists bone products only (demo: skull, spine, pelvis)', bonesProducts.length === 3 && !bonesProducts.some((h) => /heart/.test(h)), bonesProducts.join(','))
const cardBox = await card.boundingBox(); const firstProd = await p.locator('main a[href^="/product/"]').first().boundingBox()
ok('builder card sits above the products', cardBox && firstProd && cardBox.y < firstProd.y)
const html = await p.content()
ok('Bones canonical', /<link rel="canonical" href="https:\/\/3dversebd\.com\/category\/bones"/.test(html))
ok('Bones hreflang en + bn', /hreflang="bn" href="https:\/\/3dversebd\.com\/bn\/category\/bones"/i.test(html) && /hreflang="en" href="https:\/\/3dversebd\.com\/category\/bones"/i.test(html))
ok('Bones breadcrumb Home / Shop / Bones', /"name":"Shop"/.test(html) && /"item":"https:\/\/3dversebd\.com\/category\/bones"/.test(html))
await p.screenshot({ path: OUT + '5-bones-en.png', fullPage: true })
await card.locator('a').click(); await p.waitForURL('**/skeleton-builder')
ok('CTA opens the builder', /3D Skeleton Builder/.test(await p.locator('h1').textContent()))
ok('navbar keeps Bones highlighted on the builder', /text-clay/.test(await p.locator('header nav[aria-label] a[href="/category/bones"]').getAttribute('class')))
ok('builder breadcrumb goes to Bones', (await p.locator('nav[aria-label] a[href="/category/bones"]').count()) >= 1)
ok('no console errors (bones + builder)', p.errs.length === 0, p.errs.join(' | '))
await p.context().close()

// 4. Bangla Bones + language switch keeps the category
p = await page()
r = await p.goto(B + '/bn/category/bones', { waitUntil: 'networkidle' })
ok('/bn/category/bones is 200 with Bangla heading', r.status() === 200 && (await p.locator('h1').textContent()).trim() === 'হাড়')
ok('Bangla builder card', /নিজেই তৈরি করুন আপনার Skeleton Set/.test(await p.locator('section[aria-labelledby="builder-feature-title"]').textContent()))
await p.screenshot({ path: OUT + '6-bones-bn.png', fullPage: true })
const sw = p.locator('header').getByRole('button', { name: /^EN —/ }).first()
if (await sw.count()) { await sw.click(); await p.waitForURL((u) => !u.pathname.startsWith('/bn')); ok('language switch keeps the Bones page', new URL(p.url()).pathname === '/category/bones', p.url()) }
else ok('language switch keeps the Bones page', false, 'switch not found')
await p.context().close()

// 5. Medical category
p = await page()
r = await p.goto(B + '/category/medical', { waitUntil: 'networkidle' })
ok('/category/medical is 200', r.status() === 200 && (await p.locator('h1').textContent()).trim() === 'Medical')
const medProducts = await p.$$eval('main a[href^="/product/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))])
ok('Medical lists only medical products (demo: heart)', medProducts.length === 1 && /heart/.test(medProducts[0]), medProducts.join(','))
ok('no builder card on Medical', (await p.locator('section[aria-labelledby="builder-feature-title"]').count()) === 0)
await p.screenshot({ path: OUT + '7-medical-en.png', fullPage: true })
r = await p.goto(B + '/bn/category/medical', { waitUntil: 'networkidle' })
ok('/bn/category/medical Bangla heading', r.status() === 200 && (await p.locator('h1').textContent()).trim() === 'মেডিকেল')
await p.context().close()

// 6. Old URL redirects, unknown category 404
p = await page()
for (const [from, to] of [['/category/medical-bone-models', '/category/bones'], ['/bn/category/medical-bone-models', '/bn/category/bones'], ['/category/medical-bone-models?ref=fb', '/category/bones?ref=fb']]) {
  const res = await p.request.get(B + from, { maxRedirects: 0 })
  ok(`redirect ${from} -> ${to} (308)`, res.status() === 308 && res.headers().location === to, `${res.status()} ${res.headers().location}`)
}
r = await p.goto(B + '/category/medical-bone-models', { waitUntil: 'networkidle' })
ok('old URL ends on Bones (no loop)', new URL(p.url()).pathname === '/category/bones' && r.status() === 200)
r = await p.goto(B + '/category/no-such-category', { waitUntil: 'domcontentloaded' })
ok('unknown category is a real 404', r.status() === 404)
await p.context().close()

// 7. Shop filters
p = await page()
await p.goto(B + '/shop', { waitUntil: 'networkidle' })
const opts = await p.$$eval('select[aria-label] option', (os) => os.map((o) => [o.value, o.textContent.trim()]))
const catOpts = opts.filter(([v]) => !['popular', 'newest', 'price-asc', 'price-desc'].includes(v))
ok('shop: All, Medical, Bones first, then the others', catOpts[0][0] === 'all' && catOpts[1][0] === 'medical' && catOpts[2][0] === 'bones' && catOpts.length > 4, JSON.stringify(catOpts.slice(0, 4)))
ok('shop: old category not listed', !catOpts.some(([v]) => v === 'medical-bone-models'))
ok('shop: counts shown (Medical 1, Bones 3)', /\(1\)$/.test(catOpts[1][1]) && /\(3\)$/.test(catOpts[2][1]), JSON.stringify(catOpts.slice(1, 3)))
const allCount = async () => (await p.locator('[aria-live="polite"]').first().textContent()).match(/\d+/)?.[0]
const total = await allCount()
await p.selectOption('select[aria-label]:first-of-type', 'bones'); await p.waitForTimeout(400)
ok('shop filter Bones = 3', (await allCount()) === '3')
await p.screenshot({ path: OUT + '8-shop-bones.png' })
await p.selectOption('select[aria-label]:first-of-type', 'medical'); await p.waitForTimeout(400)
ok('shop filter Medical = 1', (await allCount()) === '1')
await p.selectOption('select[aria-label]:first-of-type', 'all'); await p.waitForTimeout(400)
ok('shop All shows everything again', (await allCount()) === total)
await p.goto(B + '/shop?category=medical-bone-models', { waitUntil: 'networkidle' }); await p.waitForTimeout(400)
ok('old ?category= link opens Bones', (await allCount()) === '3')
await p.goto(B + '/bn/shop', { waitUntil: 'networkidle' })
const bnOpts = await p.$$eval('select[aria-label] option', (os) => os.map((o) => o.textContent.trim()))
ok('shop BN: মেডিকেল and হাড় options', bnOpts.some((x) => /^মেডিকেল/.test(x)) && bnOpts.some((x) => /^হাড়/.test(x)))
ok('no console errors (shop)', p.errs.length === 0, p.errs.join(' | '))
await p.context().close()

// 8. Sitemap
p = await page()
const sm = await (await p.request.get(B + '/sitemap.xml')).text()
ok('sitemap has /category/bones and /category/medical', sm.includes('/category/bones') && sm.includes('/category/medical<') || sm.includes('/category/medical'))
ok('sitemap has no old category URL', !sm.includes('medical-bone-models'))
await p.context().close()

await b.close()
console.log(results.join('\n'))
const failed = results.filter((x) => x.startsWith('FAIL')).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
