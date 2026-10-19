// Automated accessibility scan (axe-core, WCAG 2.1 A/AA rules) plus a few
// keyboard checks, on the main public pages in English and Bangla.
// Usage: start the built site, then  BASE_URL=http://localhost:3123 node e2e/a11y.mjs
// Automated tools find roughly a third of real-world issues; this does not
// replace a manual screen-reader review.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const B = process.env.BASE_URL || 'http://localhost:3123'
const PAGES = ['/', '/shop', '/product/pelvis-anatomical-model', '/cart', '/login', '/signup', '/track', '/contact', '/faq', '/about', '/refund-policy', '/no-such-page']
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
await ctx.route(/placehold\.co|google|facebook|ipwho/, (r) => r.abort())
const summary = {}
let serious = 0
for (const lang of ['', '/bn']) {
  for (const path of PAGES) {
    const p = await ctx.newPage()
    const url = B + (lang + path).replace(/\/$/, '') || B + '/'
    await p.goto(url || B, { waitUntil: 'networkidle' }).catch(() => {})
    await p.waitForTimeout(400)
    const r = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    for (const v of r.violations) {
      const k = `${v.impact} ${v.id}`
      summary[k] = summary[k] || { help: v.help, pages: new Set(), nodes: 0, sample: v.nodes[0]?.target?.join(' ') }
      summary[k].pages.add(lang + path); summary[k].nodes += v.nodes.length
      if (v.impact === 'serious' || v.impact === 'critical') serious += v.nodes.length
    }
    await p.close()
  }
}
const rows = Object.entries(summary).sort()
for (const [k, v] of rows) console.log(`${k} — ${v.help} — ${v.nodes} node(s) on ${[...v.pages].join(', ')} — e.g. ${v.sample}`)
console.log(`\n${rows.length} rule(s) violated; ${serious} serious/critical node(s)`)

// Keyboard: the first Tab stops land on visible, named controls.
const p = await ctx.newPage()
await p.goto(B + '/', { waitUntil: 'networkidle' })
const stops = []
for (let i = 0; i < 8; i++) {
  await p.keyboard.press('Tab')
  stops.push(await p.evaluate(() => {
    const e = document.activeElement
    const cs = getComputedStyle(e)
    const name = (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30)
    const visibleFocus = cs.outlineStyle !== 'none' || cs.boxShadow !== 'none'
    return { tag: e.tagName, name, visibleFocus }
  }))
}
console.log('\nFirst Tab stops:', stops.map((s) => `${s.tag}:${s.name || '(no name)'}${s.visibleFocus ? '' : ' [NO VISIBLE FOCUS]'}`).join(' → '))
await b.close()
