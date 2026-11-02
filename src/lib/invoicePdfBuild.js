// SERVER ONLY. Builds the invoice PDF for an order from the CURRENT invoice row
// (so charge/payment updates are always included). Used by the PDF download
// route and by customer emails (as an attachment).
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import {
  INVOICE_BRAND, invoiceItems, invoiceMoney, formatInvoiceDate,
  paymentStatusLabel, paymentStatusColor, paymentMethodLabel,
} from '@/lib/invoices'
import { orderStatusLabel } from '@/lib/orders'
import { InvoiceDocument } from '@/lib/invoicePdf'

// supabase: a client scoped to the caller (RLS applies). origin: this site's
// origin, used to load the logo; the PDF renders without it if that fails.
export async function buildInvoicePdf({ supabase, orderId, origin }) {
  const { data: invoice, error: invErr } = await supabase
    .from('invoices').select('*').eq('order_id', orderId).maybeSingle()
  if (invErr) return { error: 'Could not load the invoice.', status: 500 }
  if (!invoice) return { error: 'No invoice exists for this order yet.', status: 404 }

  const { data: order } = await supabase
    .from('orders')
    .select('status, steadfast_consignment_id, steadfast_tracking_code')
    .eq('id', orderId).maybeSingle()

  let logo = null
  if (origin) {
    try {
      const r = await fetch(`${origin}/logo-mark.png`, { cache: 'no-store' })
      if (r.ok) logo = 'data:image/png;base64,' + Buffer.from(await r.arrayBuffer()).toString('base64')
    } catch {}
  }

  const delivery = order?.steadfast_consignment_id
    ? { courier: 'Steadfast', cid: order.steadfast_consignment_id, tracking: order.steadfast_tracking_code }
    : null

  try {
    const buffer = await renderToBuffer(
      createElement(InvoiceDocument, {
        brand: INVOICE_BRAND,
        invoice: { ...invoice, order_status_label: orderStatusLabel(order?.status) },
        items: invoiceItems(invoice),
        mnt: invoiceMoney(invoice),
        dateStr: formatInvoiceDate(invoice.invoice_date),
        statusLabel: paymentStatusLabel(invoice.payment_status),
        statusColor: paymentStatusColor(invoice.payment_status),
        methodLabel: paymentMethodLabel(invoice.payment_method),
        delivery,
        logo,
      })
    )
    return { buffer, invoice, filename: `${invoice.invoice_number}.pdf` }
  } catch {
    return { error: 'Could not generate the PDF. Please try again.', status: 500, invoice }
  }
}
