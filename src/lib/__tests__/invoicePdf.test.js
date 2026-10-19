// @vitest-environment node
// The admin invoice PDF must keep rendering across @react-pdf/renderer and
// React upgrades (the route only runs for signed-in users, so the browser
// suites never reach it). Renders a two-item invoice and checks the output
// is a real, multi-object PDF.
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoiceDocument } from '@/lib/invoicePdf'
import {
  INVOICE_BRAND, invoiceItems, invoiceMoney, formatInvoiceDate,
  paymentStatusLabel, paymentStatusColor, paymentMethodLabel,
} from '@/lib/invoices'

const invoice = {
  invoice_number: 'INV-TEST-0001',
  invoice_date: '2026-10-01T10:00:00Z',
  customer_name: 'Test Customer',
  customer_phone: '01700000000',
  shipping_address: 'Test address, Sylhet',
  items: [
    { name: 'Human Heart Model', qty: 2, unit_price: 950 },
    { product_name_snapshot: 'Pen Holder', quantity: 1, unit_price_snapshot: 300 },
  ],
  subtotal: 2200, delivery_charge: 120, discount: 0, total: 2320, paid_amount: 120,
  payment_status: 'partial', payment_method: 'bkash',
  order_status_label: 'Confirmed',
}

describe('invoice PDF', () => {
  it('renders a valid PDF with the frozen line items', async () => {
    const buf = await renderToBuffer(createElement(InvoiceDocument, {
      brand: INVOICE_BRAND,
      invoice,
      items: invoiceItems(invoice),
      mnt: invoiceMoney(invoice),
      dateStr: formatInvoiceDate(invoice.invoice_date),
      statusLabel: paymentStatusLabel(invoice.payment_status),
      statusColor: paymentStatusColor(invoice.payment_status),
      methodLabel: paymentMethodLabel(invoice.payment_method),
      delivery: { courier: 'Steadfast', cid: '123', tracking: 'TRK1' },
      logo: null,
    }))
    const head = buf.subarray(0, 5).toString('latin1')
    expect(head).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(2000)
    expect(buf.subarray(-6).toString('latin1')).toMatch(/%%EOF/)
  }, 30000)
})
