// After `next build`: every function that renders an invoice PDF must ship
// pdfkit's standard font files. They are loaded with require('#standard-fonts/...'),
// which the file tracer cannot follow, so next.config.mjs includes them
// explicitly. If this check fails, invoice PDFs fail on Vercel ("Cannot find module ...").
import fs from 'node:fs'
const ROUTES = ['.next/server/app/api/invoices/[orderId]/pdf/route.js.nft.json', '.next/server/app/api/orders/[orderId]/email/route.js.nft.json']
let bad = 0
for (const f of ROUTES) {
  const files = JSON.parse(fs.readFileSync(f, 'utf8')).files
  const fonts = files.filter((p) => p.includes('pdfkit/js/standard-fonts/'))
  const ok = fonts.some((p) => p.endsWith('Helvetica.cjs')) && fonts.some((p) => p.endsWith('HelveticaBold.cjs'))
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + f.split('/app/')[1] + ': ' + fonts.length + ' pdfkit standard font files')
  if (!ok) bad++
}
process.exit(bad ? 1 : 0)
