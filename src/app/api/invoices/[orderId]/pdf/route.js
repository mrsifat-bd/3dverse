import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { requireUser } from '@/lib/serverSupabase'
import {
  INVOICE_BRAND, invoiceItems, invoiceMoney, formatInvoiceDate,
  paymentStatusLabel, paymentStatusColor, paymentMethodLabel,
} from '@/lib/invoices'
import { orderStatusLabel } from '@/lib/orders'
import { InvoiceDocument } from '@/lib/invoicePdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  // Any authenticated user; RLS then limits invoice/order visibility to
  // admins or the order's own customer.
  const auth = await requireUser(req)
  if (auth.error) return jsonError(auth.error, auth.status)
  const { supabase } = auth

  const orderId = params?.orderId
  if (!orderId) return jsonError('Missing order id.', 400)

  const { data: invoice, error: invErr } = await supabase
    .from('invoices').select('*').eq('order_id', orderId).maybeSingle()
  if (invErr) return jsonError('Could not load the invoice.', 500)
  if (!invoice) return jsonError('No invoice exists for this order yet.', 404)

  const { data: order } = await supabase
    .from('orders')
    .select('status, steadfast_consignment_id, steadfast_tracking_code')
    .eq('id', orderId).maybeSingle()

  // Logo: fetch this deployment's own static asset; render without it on failure.
  let logo = null
  try {
    const origin = new URL(req.url).origin
    const r = await fetch(`${origin}/logo-invoice.png`, { cache: 'no-store' })
    if (r.ok) logo = 'data:image/png;base64,' + Buffer.from(await r.arrayBuffer()).toString('base64')
  } catch {}

  const delivery = order?.steadfast_consignment_id
    ? { courier: 'Steadfast', cid: order.steadfast_consignment_id, tracking: order.steadfast_tracking_code }
    : null

  let buffer
  try {
    buffer = await renderToBuffer(
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
  } catch (e) {
    return jsonError('Could not generate the PDF. Please try again.', 500)
  }

  const filename = `${invoice.invoice_number}.pdf`
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status: status || 500,
    headers: { 'Content-Type': 'application/json' },
  })
}
