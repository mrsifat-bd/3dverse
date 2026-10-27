// After `next build`: the invoice PDF function must ship pdfkit's standard font
// files. They are loaded with require('#standard-fonts/...'), which the file
// tracer cannot follow, so next.config.mjs includes them explicitly. If this
// check fails, every invoice PDF fails on Vercel ("Cannot find module ...").
import fs from 'node:fs'
const f = '.next/server/app/api/invoices/[orderId]/pdf/route.js.nft.json'
const files = JSON.parse(fs.readFileSync(f, 'utf8')).files
const fonts = files.filter((p) => p.includes('pdfkit/js/standard-fonts/'))
if (!fonts.some((p) => p.endsWith('Helvetica.cjs')) || !fonts.some((p) => p.endsWith('Helvetica-Bold.cjs') || p.endsWith('HelveticaBold.cjs'))) {
  console.error('FAIL: invoice PDF function is missing pdfkit standard fonts (' + fonts.length + ' font files traced)')
  process.exit(1)
}
console.log('OK: invoice PDF function includes ' + fonts.length + ' pdfkit standard font files')
