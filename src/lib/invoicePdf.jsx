import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'

// A real vector PDF (not a screenshot). A4, clean margins, auto-pagination,
// page numbers. Helvetica is used, so amounts are prefixed "Tk" (Helvetica has
// no Bengali Taka glyph) — the on-screen HTML preview uses the ৳ sign.
const CLAY = '#C0603A'
const INK = '#2C2A26'
const STONE = '#8A8577'
const LINE = '#E4DED2'
const CREAM = '#F4F1EA'

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 64, paddingHorizontal: 40, fontSize: 9.5, color: INK, fontFamily: 'Helvetica', lineHeight: 1.4 },
  row: { flexDirection: 'row' },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 6 },
  brandName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: INK },
  brandSub: { fontSize: 8, color: CLAY, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  brandMeta: { fontSize: 8, color: STONE, marginTop: 2 },
  invoiceWord: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: CLAY, letterSpacing: 2, textAlign: 'right' },
  metaLabel: { fontSize: 7.5, color: STONE, textTransform: 'uppercase', letterSpacing: 0.6 },
  metaValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: INK },
  rule: { height: 1, backgroundColor: LINE, marginVertical: 14 },
  sectionTitle: { fontSize: 8, color: STONE, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  card: { flexGrow: 1, flexBasis: 0 },
  th: { flexDirection: 'row', backgroundColor: INK, color: '#fff', paddingVertical: 6, paddingHorizontal: 8, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, color: '#fff' },
  tr: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: LINE },
  trAlt: { backgroundColor: CREAM },
  cProduct: { flexGrow: 1, flexBasis: 0, paddingRight: 8 },
  cQty: { width: 42, textAlign: 'center' },
  cUnit: { width: 78, textAlign: 'right' },
  cTotal: { width: 84, textAlign: 'right' },
  totalsBox: { width: 230, marginLeft: 'auto', marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 8, backgroundColor: INK, borderRadius: 3, marginTop: 4 },
  grandText: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 11 },
  pill: { alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 26, left: 40, right: 40, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8 },
  footThanks: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: INK },
  footTag: { fontSize: 8, color: CLAY, fontFamily: 'Helvetica-Bold', marginTop: 1 },
  footMeta: { fontSize: 7.5, color: STONE, marginTop: 3 },
  pageNum: { position: 'absolute', bottom: 26, right: 40, fontSize: 7.5, color: STONE },
})

const money = (n) => 'Tk ' + (Number(n) || 0).toLocaleString('en-IN')

function KV({ label, value, valueColor }) {
  return (
    <View style={{ marginBottom: 5 }}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={[s.metaValue, valueColor ? { color: valueColor } : null]}>{value || '—'}</Text>
    </View>
  )
}

export function InvoiceDocument({ brand, invoice, items, mnt, dateStr, statusLabel, statusColor, methodLabel, delivery, logo }) {
  return (
    <Document title={invoice.invoice_number} author={brand.legalName}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.between}>
          <View style={s.headerLeft}>
            {logo ? <Image src={logo} style={s.logo} /> : null}
            <View>
              <Text style={s.brandName}>{brand.name}</Text>
              <Text style={s.brandSub}>{brand.tagline}</Text>
              <Text style={s.brandMeta}>{brand.website.replace(/^https?:\/\//, '')}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.invoiceWord}>INVOICE</Text>
            <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
              <Text style={s.metaLabel}>Invoice No</Text>
              <Text style={s.metaValue}>{invoice.invoice_number}</Text>
              <Text style={[s.metaLabel, { marginTop: 4 }]}>Order ID</Text>
              <Text style={s.metaValue}>{invoice.order_number_snapshot}</Text>
              <Text style={[s.metaLabel, { marginTop: 4 }]}>Invoice Date</Text>
              <Text style={s.metaValue}>{dateStr}</Text>
            </View>
          </View>
        </View>

        <View style={s.rule} />

        {/* Bill to + payment meta */}
        <View style={s.between}>
          <View style={[s.card, { paddingRight: 20 }]}>
            <Text style={s.sectionTitle}>Bill To</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11 }}>{invoice.customer_name || '—'}</Text>
            {invoice.customer_phone ? <Text style={{ marginTop: 2 }}>{invoice.customer_phone}</Text> : null}
            {invoice.customer_email ? <Text>{invoice.customer_email}</Text> : null}
            {invoice.customer_address ? <Text style={{ marginTop: 2, color: STONE }}>{invoice.customer_address}</Text> : null}
          </View>
          <View style={[s.card, { alignItems: 'flex-end' }]}>
            <KV label="Order Status" value={invoice.order_status_label} />
            <View style={{ marginBottom: 5, alignItems: 'flex-end' }}>
              <Text style={s.metaLabel}>Payment Status</Text>
              <Text style={[s.pill, { color: '#fff', backgroundColor: statusColor, marginTop: 2 }]}>{statusLabel}</Text>
            </View>
            <KV label="Payment Method" value={methodLabel} />
          </View>
        </View>

        {/* Items */}
        <View style={{ marginTop: 16 }}>
          <View style={s.th}>
            <Text style={[s.thText, s.cProduct]}>Product</Text>
            <Text style={[s.thText, s.cQty]}>Qty</Text>
            <Text style={[s.thText, s.cUnit]}>Unit Price</Text>
            <Text style={[s.thText, s.cTotal]}>Total</Text>
          </View>
          {items.map((it, i) => (
            <View key={i} style={[s.tr, i % 2 === 1 ? s.trAlt : null]} wrap={false}>
              <Text style={s.cProduct}>{it.name}</Text>
              <Text style={s.cQty}>{it.qty}</Text>
              <Text style={s.cUnit}>{money(it.unit)}</Text>
              <Text style={s.cTotal}>{money(it.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsBox}>
          <View style={s.totalRow}><Text style={{ color: STONE }}>Subtotal</Text><Text>{money(mnt.subtotal)}</Text></View>
          <View style={s.totalRow}><Text style={{ color: STONE }}>Delivery charge</Text><Text>{money(mnt.delivery)}</Text></View>
          {mnt.discount > 0 ? (
            <View style={s.totalRow}><Text style={{ color: STONE }}>Discount</Text><Text>- {money(mnt.discount)}</Text></View>
          ) : null}
          <View style={s.grandRow}><Text style={s.grandText}>Total</Text><Text style={s.grandText}>{money(mnt.total)}</Text></View>
          {mnt.paid > 0 ? (
            <>
              <View style={s.totalRow}><Text style={{ color: STONE }}>Paid</Text><Text>{money(mnt.paid)}</Text></View>
              <View style={s.totalRow}><Text style={{ fontFamily: 'Helvetica-Bold', color: CLAY }}>Due</Text><Text style={{ fontFamily: 'Helvetica-Bold', color: CLAY }}>{money(mnt.due)}</Text></View>
            </>
          ) : null}
        </View>

        {/* Delivery info — only when a shipment actually exists */}
        {delivery ? (
          <View style={{ marginTop: 18 }}>
            <Text style={s.sectionTitle}>Delivery Information</Text>
            <View style={s.row}>
              <View style={s.card}><Text style={s.metaLabel}>Courier</Text><Text style={s.metaValue}>{delivery.courier}</Text></View>
              <View style={s.card}><Text style={s.metaLabel}>Consignment ID</Text><Text style={s.metaValue}>{delivery.cid || '—'}</Text></View>
              <View style={s.card}><Text style={s.metaLabel}>Tracking Code</Text><Text style={s.metaValue}>{delivery.tracking || '—'}</Text></View>
            </View>
          </View>
        ) : null}

        {/* Footer (repeats on each page) */}
        <View style={s.footer} fixed>
          <Text style={s.footThanks}>Thank you for choosing {brand.name}.</Text>
          <Text style={s.footTag}>{brand.tagline}</Text>
          <Text style={s.footMeta}>
            {brand.website.replace(/^https?:\/\//, '')}  ·  {brand.email}  ·  {brand.phone}  ·  {brand.location}
          </Text>
        </View>
        <Text style={s.pageNum} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>
    </Document>
  )
}
