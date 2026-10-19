// Technical SEO / link crawl of the public site, starting from the sitemap.
// Usage:  BASE_URL=http://localhost:3123 node e2e/crawl.mjs
//   (SITEMAP_HOST: the absolute host used inside the sitemap, default
//    https://3dversebd.com — URLs are rewritten to BASE_URL for fetching.)
// Checks: status codes, redirects, canonical (one, self-referencing,
// same language), hreflang reciprocity, <html lang>, title/description
// present + unique, robots meta, internal links and same-origin images.
const B = (process.env.BASE_URL || 'http://localhost:3123').replace(/\/$/, '')
const HOST = (process.env.SITEMAP_HOST || 'https://3dversebd.com').replace(/\/$/, '')
const local = (u) => u.replace(HOST, B).replace(/^https?:\/\/www\.3dversebd\.com/, B)
const issues = []
const issue = (kind, where, detail = '') => issues.push(`${kind} | ${where}${detail ? ' | ' + detail : ''}`)

async function get(url, redirect = 'manual') {
  const r = await fetch(url, { redirect, headers: { 'user-agent': '3dverse-seo-crawl' } })
  return { status: r.status, location: r.headers.get('location'), text: r.status === 200 ? await r.text() : '' }
}
const attr = (tag, name) => (tag.match(new RegExp(`${name}="([^"]*)"`, 'i')) || [])[1]
const unescape = (s) => (s || '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"')

const sm = await get(B + '/sitemap.xml')
const urls = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
console.log(`sitemap: ${urls.length} URLs`)
const pages = new Map()
const titles = new Map(); const descs = new Map()
const links = new Set(); const images = new Set()

for (const u of urls) {
  const path = new URL(u).pathname
  const r = await get(local(u))
  if (r.status !== 200) { issue('SITEMAP_NOT_200', path, `${r.status} ${r.location || ''}`); continue }
  const h = r.text
  const lang = (h.match(/<html[^>]*lang="([^"]+)"/) || [])[1]
  const expectLang = path === '/bn' || path.startsWith('/bn/') ? 'bn' : 'en'
  // <html lang> is corrected by an inline script for /bn before paint; the raw HTML says en.
  const canon = [...h.matchAll(/<link[^>]+rel="canonical"[^>]*>/g)].map((m) => attr(m[0], 'href'))
  if (canon.length !== 1) issue('CANONICAL_COUNT', path, String(canon.length))
  else if (new URL(canon[0], HOST).pathname !== path) issue('CANONICAL_NOT_SELF', path, canon[0])
  const alts = Object.fromEntries([...h.matchAll(/<link[^>]+hreflang="([^"]+)"[^>]*>/gi)].map((m) => [m[1], new URL(attr(m[0], 'href'), HOST).pathname]))
  if (!alts.en || !alts.bn || !alts['x-default']) issue('HREFLANG_MISSING', path, JSON.stringify(alts))
  if (alts[expectLang] && alts[expectLang] !== path) issue('HREFLANG_SELF_MISMATCH', path, alts[expectLang])
  const robots = (h.match(/<meta[^>]+name="robots"[^>]*>/) || [''])[0]
  if (/noindex/.test(robots)) issue('NOINDEX_IN_SITEMAP', path)
  const title = unescape((h.match(/<title>([^<]*)<\/title>/) || [])[1] || '')
  const desc = unescape(attr((h.match(/<meta[^>]+name="description"[^>]*>/) || [''])[0], 'content') || '')
  if (!title) issue('TITLE_MISSING', path)
  if (!desc) issue('DESCRIPTION_MISSING', path)
  if (title) titles.set(title, [...(titles.get(title) || []), path])
  if (desc) descs.set(desc, [...(descs.get(desc) || []), path])
  if ((h.match(/<h1[\s>]/g) || []).length !== 1) issue('H1_COUNT', path, String((h.match(/<h1[\s>]/g) || []).length))
  for (const m of h.matchAll(/<a[^>]+href="(\/[^"#?]*)/g)) links.add(m[1])
  for (const m of h.matchAll(/<img[^>]+src="(\/[^"]+)"/g)) images.add(unescape(m[1]))
  for (const m of h.matchAll(/<img[^>]*>/g)) if (!/\salt="/.test(m[0])) issue('IMG_NO_ALT', path, m[0].slice(0, 80))
  pages.set(path, { lang, alts, expectLang })
}
// hreflang reciprocity: the page each alternate points to must point back.
for (const [path, { alts, expectLang }] of pages) {
  for (const [l, target] of Object.entries(alts)) {
    if (l === 'x-default' || l === expectLang) continue
    const back = pages.get(target)?.alts?.[expectLang]
    if (pages.has(target) && back !== path) issue('HREFLANG_NOT_RECIPROCAL', path, `${l} -> ${target} -> ${back}`)
    if (!pages.has(target)) issue('HREFLANG_TARGET_NOT_IN_SITEMAP', path, target)
  }
}
for (const [t, ps] of titles) if (ps.length > 1) issue('DUPLICATE_TITLE', ps.slice(0, 4).join(' '), t.slice(0, 60))
for (const [d, ps] of descs) if (ps.length > 1) issue('DUPLICATE_DESCRIPTION', ps.slice(0, 4).join(' '), d.slice(0, 60))

// Internal links and images found on the pages.
let checked = 0
for (const l of links) {
  if (l.startsWith('/api') || l.startsWith('/admin')) continue
  const r = await get(B + l); checked++
  if (r.status >= 400) issue('BROKEN_LINK', l, String(r.status))
  else if (r.status >= 300) {
    const r2 = await get(new URL(r.location, B).href)
    if (r2.status >= 300) issue('REDIRECT_CHAIN', l, `${r.status} -> ${r.location} -> ${r2.status}`)
  }
}
for (const i of images) { const r = await get(B + i, 'follow'); if (r.status >= 400) issue('BROKEN_IMAGE', i, String(r.status)) }

// Private pages must not be indexable, unknown pages must 404, legacy redirects one hop.
const robotsTxt = (await get(B + '/robots.txt')).text
for (const p of ['/account', '/cart', '/checkout', '/admin', '/bn/account', '/bn/cart', '/bn/checkout']) if (!robotsTxt.includes(`Disallow: ${p}`)) issue('ROBOTS_NOT_BLOCKED', p)
for (const p of ['/no-such-page', '/bn/no-such-page', '/product/no-such-product', '/bn/category/no-such-category']) {
  const r = await get(B + p); if (r.status !== 404) issue('NOT_404', p, String(r.status))
}
for (const [from, to] of [['/return-policy', '/refund-policy'], ['/bn/return-policy', '/bn/refund-policy'], ['/privacy', '/privacy-policy'], ['/bn/terms-and-conditions', '/bn/terms'], ['/en/shop', '/shop']]) {
  const r = await get(B + from)
  const dest = r.location ? new URL(r.location, B).pathname : ''
  if (![301, 308].includes(r.status) || dest !== to) issue('LEGACY_REDIRECT', from, `${r.status} -> ${dest}`)
  else { const r2 = await get(B + dest); if (r2.status !== 200) issue('LEGACY_REDIRECT_TARGET', from, `${dest} ${r2.status}`) }
}
console.log(`pages crawled: ${pages.size}, internal links checked: ${checked}, images: ${images.size}`)
console.log(issues.length ? issues.join('\n') : 'no issues found')
// Non-zero exit so CI fails on any finding (STRICT=0 to report only).
process.exit(issues.length && process.env.STRICT !== '0' ? 1 : 0)
