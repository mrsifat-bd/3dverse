'use client'
import Image from 'next/image'
import { formatPrice } from '@/lib/format'
import {
  INVOICE_BRAND, invoiceItems, invoiceMoney, formatInvoiceDate,
  paymentStatusLabel, paymentStatusColor, paymentMethodLabel,
} from '@/lib/invoices'
import { orderStatusLabel, steadfastStatusLabel } from '@/lib/orders'

// On-screen, printable invoice. Matches the PDF layout but uses the ৳ sign and
// brand fonts. Wrap in an element with class `invoice-print-area` and the print
// stylesheet (globals.css) will print only this.
export default function InvoicePreview({ invoice, order }) {
  if (!invoice) return null
  const b = INVOICE_BRAND
  const items = invoiceItems(invoice)
  const m = invoiceMoney(invoice)
  const statusColor = paymentStatusColor(invoice.payment_status)
  const hasParcel = Boolean(order?.steadfast_consignment_id)

  return (
    <div className="invoice-sheet mx-auto w-full max-w-[794px] bg-paper p-8 text-ink sm:p-10">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-black">
            <Image src="/logo-mark.png" alt="3D Verse" width={48} height={48} className="h-12 w-12 object-contain" />
          </span>
          <div>
            <div className="font-display text-2xl font-semibold leading-none text-ink">{b.name}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-clay">{b.tagline}</div>
            <div className="mt-0.5 text-xs text-stone">{b.website.replace(/^https?:\/\//, '')}</div>
          </div>
        </div>
        <div className="sm:text-right">
          <div className="font-display text-3xl font-bold tracking-[0.15em] text-clay">INVOICE</div>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Meta label="Invoice No" value={invoice.invoice_number} />
            <Meta label="Order ID" value={invoice.order_number_snapshot} />
            <Meta label="Invoice Date" value={formatInvoiceDate(invoice.invoice_date)} />
          </dl>
        </div>
      </div>

      <div className="my-6 h-px bg-line" />

      {/* Bill to + status */}
      <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-stone">Bill To</h3>
          <p className="mt-1 text-base font-semibold text-ink">{invoice.customer_name || '—'}</p>
          {invoice.customer_phone && <p className="text-sm text-ink">{invoice.customer_phone}</p>}
          {invoice.customer_email && <p className="text-sm text-ink">{invoice.customer_email}</p>}
          {invoice.customer_address && <p className="mt-1 max-w-xs text-sm text-stone">{invoice.customer_address}</p>}
        </div>
        <div className="space-y-2 sm:text-right">
          <Meta label="Order Status" value={orderStatusLabel(order?.status)} />
          <div className="sm:flex sm:flex-col sm:items-end">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone">Payment Status</span>
            <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: statusColor }}>
              {paymentStatusLabel(invoice.payment_status)}
            </span>
          </div>
          <Meta label="Payment Method" value={paymentMethodLabel(invoice.payment_method)} />
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[440px] border-collapse text-sm">
          <thead>
            <tr className="bg-ink text-paper">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">Product</th>
              <th className="w-16 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider">Qty</th>
              <th className="w-28 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider">Unit Price</th>
              <th className="w-28 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-cream/60' : ''}>
                <td className="px-3 py-2 align-top text-ink">{it.name}</td>
                <td className="px-3 py-2 text-center align-top text-ink">{it.qty}</td>
                <td className="px-3 py-2 text-right align-top text-ink">{formatPrice(it.unit)}</td>
                <td className="px-3 py-2 text-right align-top font-medium text-ink">{formatPrice(it.total)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-stone">No items.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-xs space-y-1.5 text-sm">
          <Line label="Subtotal" value={formatPrice(m.subtotal)} />
          <Line label="Delivery charge" value={formatPrice(m.delivery)} />
          {m.discount > 0 && <Line label="Discount" value={`- ${formatPrice(m.discount)}`} />}
          <div className="mt-1 flex items-center justify-between rounded-md bg-ink px-3 py-2 text-paper">
            <span className="font-semibold">Total</span>
            <span className="font-display text-base font-bold">{formatPrice(m.total)}</span>
          </div>
          {m.paid > 0 && (
            <>
              <Line label="Paid" value={formatPrice(m.paid)} />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-clay">Due</span>
                <span className="font-semibold text-clay">{formatPrice(m.due)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delivery info — only after a real shipment exists */}
      {hasParcel && (
        <div className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-stone">Delivery Information</h3>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Meta label="Courier" value="Steadfast" />
            <Meta label="Consignment ID" value={order.steadfast_consignment_id} />
            <Meta label="Tracking Code" value={order.steadfast_tracking_code || steadfastStatusLabel(order.steadfast_status)} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 border-t border-line pt-4">
        <p className="text-sm font-semibold text-ink">Thank you for choosing {b.name}.</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-clay">{b.tagline}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-stone">
          {b.website.replace(/^https?:\/\//, '')} · {b.email} · {b.phone} · {b.location}
        </p>
      </div>
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone">{label}</div>
      <div className="text-sm font-semibold text-ink">{value || '—'}</div>
    </div>
  )
}

function Line({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-stone">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  )
}
