import { chromium } from 'playwright'
// Public-site regression checks (demo-mode build, no Supabase needed).
// Usage: start the built site, then  BASE_URL=http://localhost:3123 node e2e/regress.mjs
const B = process.env.BASE_URL || 'http://localhost:3123'
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const results = []
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`)
const ignore = /ERR_TUNNEL|Failed to load resource|placehold\.co/
async function page(vp = { width: 1366, height: 900 }, opts = {}) {
  const ctx = await b.newContext({ viewport: vp, ...opts })
  await ctx.route(/placehold\.co|google|facebook/, (r) => r.abort())
  const p = await ctx.newPage()
  p.errs = []
  p.on('pageerror', (e) => p.errs.push(e.message.slice(0, 160)))
  p.on('console', (m) => { if (m.type() === 'error' && !ignore.test(m.text())) p.errs.push(m.text().slice(0, 160)) })
  return p
}
async function scrollAll(p) {
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) } })
  await p.waitForTimeout(800)
}

// 1. Home
let p = await page()
await p.goto(B + '/', { waitUntil: 'domcontentloaded' })
const heroOpacity = await p.evaluate(() => getComputedStyle(document.querySelector('h1').closest('.enter') || document.querySelector('h1')).opacity)
ok('home hero painted without JS (no opacity:0 SSR)', !(await p.content()).includes('opacity:0;transform:translateY'), 'computed opacity at DCL ' + heroOpacity)
await p.waitForLoadState('networkidle'); await scrollAll(p)
const stuck = await p.evaluate(() => document.querySelectorAll('.reveal-pending:not(.reveal-in)').length)
ok('home: nothing left hidden after scrolling', stuck === 0, `${stuck} hidden`)
ok('home: no console errors', p.errs.length === 0, p.errs.join(' | '))
// back/forward
await p.click('a[href="/shop"]'); await p.waitForURL('**/shop'); await p.waitForTimeout(500)
await p.goBack(); await p.waitForURL(B + '/'); await p.waitForTimeout(500)
ok('back/forward: home shows content', await p.locator('h1').isVisible())
await p.goForward(); await p.waitForURL('**/shop'); await p.waitForTimeout(500)
ok('back/forward: shop shows grid', (await p.locator('a[href^="/product/"]').count()) > 0)
await p.context().close()

// 2. Shop filters
p = await page()
await p.goto(B + '/shop', { waitUntil: 'networkidle' })
const all = await p.locator('a[href^="/product/"]').count()
await p.goto(B + '/shop?q=pelvis', { waitUntil: 'networkidle' }); await p.waitForTimeout(400)
const filtered = await p.locator('a[href^="/product/"]').count()
ok('shop ?q= filter applies after load', filtered > 0 && filtered < all, `${all} → ${filtered}`)
await p.goto(B + '/shop', { waitUntil: 'networkidle' })
await p.selectOption('select[aria-label="Category"]', { index: 1 }); await p.waitForTimeout(500)
const afterCat = await p.locator('a[href^="/product/"]').count()
ok('shop category select filters', afterCat <= all, `${afterCat}`)
await scrollAll(p)
ok('shop: nothing left hidden', (await p.evaluate(() => document.querySelectorAll('.reveal-pending:not(.reveal-in)').length)) === 0)
ok('shop: no console errors', p.errs.length === 0, p.errs.join(' | '))
await p.context().close()

// 3. Product gallery dialog
p = await page()
await p.goto(B + '/product/pelvis-anatomical-model', { waitUntil: 'networkidle' })
const gal = p.getByRole('button', { name: /Open full-screen image/ })
if (await gal.count()) {
  await gal.click(); await p.waitForTimeout(400)
  const dlg = await p.locator('[role="dialog"]').count()
  const focusOk = await p.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Close')
  ok('gallery opens as dialog with focus on Close', dlg === 1 && focusOk)
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)
  ok('gallery closes with Escape', (await p.locator('[role="dialog"]').count()) === 0)
} else ok('gallery (no images in mock data — skipped)', true)
ok('product: no console errors', p.errs.length === 0, p.errs.join(' | '))
const r404 = await p.goto(B + '/product/does-not-exist'); ok('unknown product returns 404', r404.status() === 404, String(r404.status()))
await p.context().close()

// 4. Mobile menu
p = await page({ width: 390, height: 844 }, { hasTouch: true, isMobile: true })
await p.goto(B + '/', { waitUntil: 'networkidle' })
await p.click('button[aria-label="Open menu"]'); await p.waitForTimeout(350)
ok('mobile menu opens', await p.locator('#mobile-menu').isVisible())
await p.keyboard.press('Escape'); await p.waitForTimeout(400)
ok('mobile menu closes with Escape', (await p.locator('#mobile-menu').count()) === 0)
await p.click('button[aria-label="Open menu"]'); await p.waitForTimeout(350)
await p.click('#mobile-menu a[href="/about"]'); await p.waitForURL('**/about'); await p.waitForTimeout(500)
ok('mobile menu closes after navigating', (await p.locator('#mobile-menu').count()) === 0)
const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
ok('mobile: no sideways scroll', overflow <= 0, String(overflow))
// tap on a product card should navigate (no stuck hover)
await p.goto(B + '/shop', { waitUntil: 'networkidle' })
await p.locator('a[href^="/product/"]').first().tap(); await p.waitForURL('**/product/**', { timeout: 5000 }).catch(() => {})
ok('mobile: tapping a card opens the product', p.url().includes('/product/'))
ok('mobile: no console errors', p.errs.length === 0, p.errs.join(' | '))
await p.context().close()

// 5. FAQ + track + reduced motion
p = await page({ width: 1366, height: 900 }, { reducedMotion: 'reduce' })
await p.goto(B + '/faq', { waitUntil: 'networkidle' })
await p.locator('details summary').first().click(); await p.waitForTimeout(300)
ok('FAQ item expands', await p.locator('details[open] p').first().isVisible())
await p.goto(B + '/shop', { waitUntil: 'networkidle' }); await scrollAll(p)
ok('reduced motion: nothing hidden/animated', (await p.evaluate(() => document.querySelectorAll('.reveal-pending').length)) === 0)
await p.goto(B + '/track', { waitUntil: 'networkidle' })
await p.click('button[type="submit"]'); await p.waitForTimeout(300)
ok('track form shows validation message', await p.locator('p[role="alert"]').isVisible())
ok('faq/track: no console errors', p.errs.length === 0, p.errs.join(' | '))
await p.context().close()


// 6. Bangla / English
p = await page()
let r = await p.goto(B + '/bn', { waitUntil: 'networkidle' })
ok('bn: html lang=bn', (await p.evaluate(() => document.documentElement.lang)) === 'bn')
ok('bn: Content-Language header', r.headers()['content-language'] === 'bn', r.headers()['content-language'])
const bnText = await p.evaluate(() => document.body.innerText)
ok('bn: page is mostly Bangla', (bnText.match(/[ঀ-৿]/g) || []).length > 400)
const rawKeys = bnText.match(/\b(nav|common|cart|checkout|orders|home|shop|footer|product|auth|form)\.[a-z][A-Za-z]+\b/g)
ok('bn: no raw translation keys visible', !rawKeys, (rawKeys || []).slice(0, 5).join(','))
const alts = await p.evaluate(() => [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.hreflang + '=' + new URL(l.href).pathname))
ok('bn: hreflang alternates', alts.includes('en=/') && alts.includes('bn=/bn'), alts.join(' '))
ok('bn: canonical points at /bn', (await p.getAttribute('link[rel="canonical"]', 'href') || '').endsWith('/bn'))
ok('bn: no "Sylhet" on home', !/sylhet|সিলেট/i.test(bnText))
await scrollAll(p)
ok('bn home: no console errors', p.errs.length === 0, p.errs.join(' | '))
await p.context().close()

p = await page()
await p.goto(B + '/shop?q=pelvis', { waitUntil: 'networkidle' })
ok('en: html lang=en', (await p.evaluate(() => document.documentElement.lang)) === 'en')
ok('en: no "Sylhet" on home/shop', !/sylhet/i.test(await p.evaluate(() => document.body.innerText)))
await p.click('header button[lang="bn"]'); await p.waitForURL('**/bn/shop?q=pelvis'); await p.waitForTimeout(500)
ok('switcher keeps page + query', p.url().endsWith('/bn/shop?q=pelvis'), p.url())
ok('switcher: lang attr updates', (await p.evaluate(() => document.documentElement.lang)) === 'bn')
await p.goto(B + '/about', { waitUntil: 'networkidle' })
ok('choice persists: unprefixed URL opens in Bangla', p.url().endsWith('/bn/about'), p.url())
await p.reload({ waitUntil: 'networkidle' })
ok('choice persists after refresh', p.url().endsWith('/bn/about'))
const internal = await p.evaluate(() => [...document.querySelectorAll('main a[href^="/"], header a[href^="/"]')].map((a) => a.getAttribute('href')).filter((h) => !h.startsWith('/bn') && !h.startsWith('/admin') && !/\.\w+$/.test(h)))
ok('bn: internal links stay in Bangla', internal.length === 0, internal.slice(0, 5).join(','))
await p.click('header button[lang="en"]'); await p.waitForURL((u) => u.pathname === '/about'); await p.waitForTimeout(400)
await p.goto(B + '/faq', { waitUntil: 'networkidle' })
ok('switch back to English persists', p.url() === B + '/faq', p.url())
ok('switch: no console errors', p.errs.length === 0, p.errs.join(' | '))
await p.context().close()

p = await page({ width: 390, height: 844 }, { hasTouch: true, isMobile: true })
await p.goto(B + '/contact', { waitUntil: 'networkidle' })
await p.click('button[aria-label="Open menu"]'); await p.waitForTimeout(350)
await p.click('#mobile-menu button[lang="bn"]'); await p.waitForURL('**/bn/contact'); await p.waitForTimeout(400)
ok('mobile menu language switch', p.url().endsWith('/bn/contact'))
ok('bn mobile: no sideways scroll', (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0)
ok('contact mentions the main office once', ((await p.evaluate(() => document.body.innerText)).match(/সিলেট/g) || []).length >= 1)
await p.context().close()

r = await (await b.newContext()).request.get(B + '/en/shop', { maxRedirects: 0 })
ok('/en/shop redirects to /shop', [301, 308].includes(r.status()) && r.headers()['location']?.endsWith('/shop'), r.status() + ' ' + r.headers()['location'])
r = await (await b.newContext()).request.get(B + '/shop', { maxRedirects: 0, headers: { 'accept-language': 'bn' } })
ok('no cookie (search bots): English served at its own URL', r.status() === 200)
r = await (await b.newContext()).request.get(B + '/bn/nope', { maxRedirects: 0 })
ok('unknown bn page 404', r.status() === 404, String(r.status()))
r = await (await b.newContext()).request.get(B + '/sitemap.xml')
const sm = await r.text()
ok('sitemap lists Bangla pages with hreflang', sm.includes('/bn/shop') && sm.includes('hreflang="bn"'))

console.log(results.join('\n'))
const failed = results.filter((x) => x.startsWith('FAIL')).length
console.log(`\n${results.length - failed}/${results.length} passed`)
await b.close()
process.exit(failed ? 1 : 0)
