'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import {
  Loader2, RefreshCw, Truck, ChevronDown, ExternalLink, CheckCircle2, AlertTriangle, PackagePlus, Trash2, Ban,
  FileText, Download, Printer, Share2, ReceiptText, X, Plus,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import {
  getOrders, updateOrder, deleteOrder, addOrderEvent, getOrderEvents, computeTotals,
  ORDER_STATUSES, orderStatusLabel, steadfastStatusLabel, trackingUrlFor,
  getDeliveryPayment, verifyDeliveryPayment, rejectDeliveryPayment,
} from '@/lib/orders'
import {
  getInvoiceByOrder, updateInvoicePayment, generateInvoiceForOrder,
  invoiceMoney, PAYMENT_STATUSES, PAYMENT_METHODS, paymentStatusLabel, paymentStatusColor,
} from '@/lib/invoices'
import InvoicePreview from '@/components/admin/InvoicePreview'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

const COURIER_COLOR = {
  Delivered: '#5B8A5B', 'Partially delivered': '#5B8A5B',
  Cancelled: '#9A6A62', 'On hold': '#C99A4E', 'In review': '#4E86B0', Pending: '#4E86B0',
}

function fmtDate(d) {
  try { return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return d }
}

function OrderStatusBadge({ status }) {
  return <span className="inline-flex items-center rounded-full bg-clay/10 px-2.5 py-1 text-xs font-medium text-clay">{orderStatusLabel(status)}</span>
}

// bKash payment state (separate from format validation). Pending = orange
// (never green), Paid = green, Rejected = red.
const PAY_META = {
  pending: { label: 'Pending verification', color: '#C99A4E' },
  verified: { label: 'Paid', color: '#5B8A5B' },
  rejected: { label: 'Rejected', color: '#B4381F' },
}
function PaymentBadge({ status }) {
  const m = PAY_META[status] || PAY_META.pending
  return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${m.color}22`, color: m.color }}>{m.label}</span>
}

function CourierBadge({ order }) {
  if (!order.steadfast_consignment_id) {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-stone"><Truck className="h-3.5 w-3.5" /> Not created</span>
  }
  const label = steadfastStatusLabel(order.steadfast_status)
  const color = COURIER_COLOR[label] || '#4E86B0'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${color}22`, color }}>
      <Truck className="h-3.5 w-3.5" /> {label}
    </span>
  )
}

export default function OrdersTable() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [events, setEvents] = useState([])
  const [draft, setDraft] = useState({ delivery_charge: 0, discount: 0, weight_kg: 0.5 })
  const [savingMoney, setSavingMoney] = useState(false)
  const [confirmOrder, setConfirmOrder] = useState(null) // order pending parcel creation
  const [creating, setCreating] = useState(false)
  const [refreshingId, setRefreshingId] = useState(null)
  const [rowError, setRowError] = useState('')
  const [payment, setPayment] = useState(null)
  const [payBusy, setPayBusy] = useState(false)
  const [payConfirm, setPayConfirm] = useState(null) // { order, action: 'verify'|'reject', reason }
  const [invoice, setInvoice] = useState(null)
  const [invBusy, setInvBusy] = useState(false)
  const [payDraft, setPayDraft] = useState({ payment_status: 'unpaid', payment_method: 'cod', paid_amount: 0 })
  const [preview, setPreview] = useState(null) // { order, invoice } for the invoice modal

  const load = useCallback(async () => {
    setError('')
    try { setOrders(await getOrders()) } catch (e) { setError(e.message); setOrders([]) }
  }, [])
  useEffect(() => { load() }, [load])

  async function authFetch(path, body) {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    })
    let json = null
    try { json = await res.json() } catch {}
    return { ok: res.ok, status: res.status, data: json }
  }

  const visible = useMemo(() => (orders || []).filter((o) => filter === 'all' || o.status === filter), [orders, filter])

  async function expand(order) {
    setRowError('')
    if (expandedId === order.id) { setExpandedId(null); return }
    setExpandedId(order.id)
    setDraft({ delivery_charge: Number(order.delivery_charge) || 0, discount: Number(order.discount) || 0, weight_kg: Number(order.weight_kg) || 0.5 })
    setEvents([]); setPayment(null); setInvoice(null)
    try { setEvents(await getOrderEvents(order.id)) } catch {}
    try { setPayment(await getDeliveryPayment(order.id)) } catch {}
    await loadInvoice(order.id)
  }

  async function loadInvoice(orderId) {
    try {
      const inv = await getInvoiceByOrder(orderId)
      setInvoice(inv || null)
      if (inv) setPayDraft({ payment_status: inv.payment_status, payment_method: inv.payment_method, paid_amount: Number(inv.paid_amount) || 0 })
    } catch { setInvoice(null) }
  }

  async function adminEmail() {
    const { data } = await supabase.auth.getSession()
    return data?.session?.user?.email || ''
  }

  async function onVerifyPayment(order) {
    setPayBusy(true); setRowError('')
    try {
      await verifyDeliveryPayment(order.id, await adminEmail())
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, payment_status: 'verified', status: 'confirmed' } : o)))
      setPayment((p) => (p ? { ...p, status: 'verified' } : p))
      try { setEvents(await getOrderEvents(order.id)) } catch {}
      await loadInvoice(order.id) // confirming auto-generates the invoice (DB trigger)
    } catch (e) { setRowError(e.message) } finally { setPayBusy(false) }
  }

  async function cancelOrder(order) {
    if (!window.confirm('Cancel this order? The customer will see it as cancelled.')) return
    setRowError('')
    try {
      await updateOrder(order.id, { status: 'cancelled' })
      await addOrderEvent(order.id, { type: 'status', message: 'Order cancelled by admin.', actor: await adminEmail() })
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled' } : o)))
      try { setEvents(await getOrderEvents(order.id)) } catch {}
    } catch (e) { setRowError(e.message) }
  }

  async function removeOrder(order) {
    if (order.steadfast_consignment_id) { setRowError('This order has a Steadfast parcel and cannot be deleted. Cancel it instead.'); return }
    if (!window.confirm('Permanently delete this order? This cannot be undone.')) return
    setRowError('')
    try {
      await deleteOrder(order.id)
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
      setExpandedId(null)
    } catch (e) { setRowError(e.message) }
  }

  async function onRejectPayment(order, reason = '') {
    setPayBusy(true); setRowError('')
    try {
      await rejectDeliveryPayment(order.id, reason, await adminEmail())
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, payment_status: 'rejected' } : o)))
      setPayment((p) => (p ? { ...p, status: 'rejected', rejection_reason: reason } : p))
      try { setEvents(await getOrderEvents(order.id)) } catch {}
    } catch (e) { setRowError(e.message) } finally { setPayBusy(false) }
  }

  // Confirm modal gate for the (manual) payment decision.
  async function runPayConfirm() {
    if (!payConfirm) return
    const { order, action, reason } = payConfirm
    if (action === 'verify') await onVerifyPayment(order)
    else await onRejectPayment(order, reason)
    setPayConfirm(null)
  }

  function draftTotals(order) {
    return computeTotals({ items: order.items || [], delivery_charge: draft.delivery_charge, discount: draft.discount })
  }

  async function saveMoney(order) {
    setSavingMoney(true)
    setRowError('')
    try {
      const t = draftTotals(order)
      await updateOrder(order.id, {
        delivery_charge: Number(draft.delivery_charge) || 0,
        discount: Number(draft.discount) || 0,
        weight_kg: Number(draft.weight_kg) || 0,
        subtotal: t.subtotal,
        total: t.total,
        cod_amount: t.cod_amount,
      })
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, delivery_charge: Number(draft.delivery_charge) || 0, discount: Number(draft.discount) || 0, weight_kg: Number(draft.weight_kg) || 0, subtotal: t.subtotal, total: t.total, cod_amount: t.cod_amount } : o)))
    } catch (e) { setRowError(e.message) } finally { setSavingMoney(false) }
  }

  async function changeStatus(order, status) {
    const prev = orders
    setOrders((cur) => cur.map((o) => (o.id === order.id ? { ...o, status } : o)))
    try {
      await updateOrder(order.id, { status })
      await addOrderEvent(order.id, { type: 'status', message: `Status set to ${orderStatusLabel(status)}` })
      if (status === 'confirmed') { await loadInvoice(order.id); try { setEvents(await getOrderEvents(order.id)) } catch {} }
    } catch (e) { setOrders(prev); setRowError(e.message) }
  }

  // ---- Invoice actions ---------------------------------------------------
  async function onGenerateInvoice(order) {
    setInvBusy(true); setRowError('')
    try {
      await generateInvoiceForOrder(order.id)
      await loadInvoice(order.id)
      try { setEvents(await getOrderEvents(order.id)) } catch {}
    } catch (e) { setRowError(e.message || 'Could not generate the invoice.') } finally { setInvBusy(false) }
  }

  async function saveInvoicePayment() {
    if (!invoice) return
    setInvBusy(true); setRowError('')
    try {
      await updateInvoicePayment(invoice.id, payDraft)
      setInvoice((inv) => ({ ...inv, ...payDraft, paid_amount: Number(payDraft.paid_amount) || 0 }))
    } catch (e) { setRowError(e.message || 'Could not update payment.') } finally { setInvBusy(false) }
  }

  // Auth'd GET of the PDF -> Blob (the API needs a Bearer token, so a plain link won't do).
  async function fetchInvoicePdfBlob(order) {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    const res = await fetch(`/api/invoices/${order.id}/pdf`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!res.ok) {
      let msg = 'Could not generate the PDF.'
      try { msg = (await res.json())?.error || msg } catch {}
      throw new Error(msg)
    }
    return await res.blob()
  }

  async function downloadInvoice(order) {
    setInvBusy(true); setRowError('')
    try {
      const blob = await fetchInvoicePdfBlob(order)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice?.invoice_number || order.order_number}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch (e) { setRowError(e.message) } finally { setInvBusy(false) }
  }

  async function shareInvoice(order) {
    setRowError('')
    try {
      const blob = await fetchInvoicePdfBlob(order)
      const file = new File([blob], `${invoice?.invoice_number || order.order_number}.pdf`, { type: 'application/pdf' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: invoice?.invoice_number, text: `Invoice ${invoice?.invoice_number} — 3D Verse` })
      } else {
        await downloadInvoice(order) // fallback: download so the admin can attach it manually
      }
    } catch (e) { if (e?.name !== 'AbortError') setRowError(e.message || 'Sharing is not available on this device.') }
  }

  function openPreview(order, doPrint = false) {
    setPreview({ order, invoice })
    if (doPrint) setTimeout(() => window.print(), 350)
  }

  async function createParcel(order) {
    setCreating(true)
    setRowError('')
    const r = await authFetch('/api/steadfast/create-parcel', { orderId: order.id })
    setCreating(false)
    if (r.ok && r.data?.ok) {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? {
        ...o, status: 'sent_to_steadfast',
        steadfast_consignment_id: r.data.consignment_id, steadfast_tracking_code: r.data.tracking_code,
        steadfast_status: r.data.status, steadfast_created_at: new Date().toISOString(),
      } : o)))
      setConfirmOrder(null)
      try { setEvents(await getOrderEvents(order.id)) } catch {}
    } else if (r.status === 409 && r.data?.already) {
      // Already created — sync local state, close modal, warn.
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, steadfast_consignment_id: r.data.consignment_id, steadfast_tracking_code: r.data.tracking_code } : o)))
      setConfirmOrder(null)
      setRowError('A Steadfast parcel already exists for this order.')
    } else {
      setRowError(r.data?.error || 'Unable to create Steadfast parcel. Please try again.')
    }
  }

  async function refreshStatus(order) {
    setRefreshingId(order.id)
    setRowError('')
    const r = await authFetch('/api/steadfast/refresh-status', { orderId: order.id })
    setRefreshingId(null)
    if (r.ok && r.data?.ok) {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, steadfast_status: r.data.delivery_status } : o)))
      try { setEvents(await getOrderEvents(order.id)) } catch {}
    } else {
      setRowError(r.data?.error || 'Could not refresh courier status.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Orders</h1>
          <p className="mt-1 text-sm text-stone">Review orders and create Steadfast courier parcels.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild><Link href="/admin/orders/new"><Plus className="h-4 w-4" /> New order</Link></Button>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {orders === null ? (
        <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper py-16 text-center text-sm text-stone">No orders yet. They appear when a customer submits the delivery form.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => {
            const open = expandedId === order.id
            const t = open ? draftTotals(order) : { subtotal: order.subtotal, total: order.total, cod_amount: order.cod_amount }
            const created = Boolean(order.steadfast_consignment_id)
            return (
              <div key={order.id} className="overflow-hidden rounded-2xl border border-line bg-paper">
                {/* Row header */}
                <button onClick={() => expand(order)} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-line/40">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-semibold text-ink">{order.order_number}</span>
                      <OrderStatusBadge status={order.status} />
                      <PaymentBadge status={order.payment_status} />
                      <CourierBadge order={order} />
                    </div>
                    <p className="mt-1 truncate text-sm text-stone">{order.customer_name} · {order.customer_phone} · {fmtDate(order.created_at)}</p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold text-ink">{formatPrice(order.cod_amount)}</span>
                    <span className="text-xs text-stone">COD</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-stone transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded detail */}
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-t border-line">
                      <div className="grid gap-6 p-5 lg:grid-cols-2">
                        {/* Left: customer + items + money */}
                        <div className="space-y-5">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-stone">Delivery to</p>
                            <p className="mt-1 text-sm font-medium text-ink">{order.customer_name} · {order.customer_phone}</p>
                            <p className="text-sm text-stone">{order.customer_address}</p>
                            {order.note && <p className="mt-1 text-sm text-stone">Note: {order.note}</p>}
                          </div>

                          <div className="rounded-xl border border-line p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs uppercase tracking-wide text-stone">Delivery payment (bKash)</p>
                              <PaymentBadge status={order.payment_status} />
                            </div>
                            {payment ? (
                              <div className="mt-3 space-y-1.5 text-sm">
                                <div className="flex justify-between"><span className="text-stone">Amount</span><span className="text-ink">{formatPrice(payment.amount)}</span></div>
                                <div className="flex justify-between"><span className="text-stone">Sent to</span><span className="text-ink">{payment.receiver_number}</span></div>
                                <div className="flex justify-between"><span className="text-stone">Transaction ID</span><span className="font-medium text-ink">{payment.transaction_id}</span></div>
                                {payment.rejection_reason && <p className="text-xs text-destructive">Reason: {payment.rejection_reason}</p>}
                                {order.payment_status === 'pending' && (
                                  <>
                                    <p className="mt-2 text-xs text-stone">A valid-looking transaction ID is not proof of payment. Check bKash for {formatPrice(payment.amount)} to {payment.receiver_number} before marking as paid.</p>
                                    <div className="mt-2 flex gap-2">
                                      <Button size="sm" onClick={() => setPayConfirm({ order, action: 'verify', reason: '' })} disabled={payBusy}><CheckCircle2 className="h-3.5 w-3.5" /> Mark as Paid</Button>
                                      <Button size="sm" variant="ghost" onClick={() => setPayConfirm({ order, action: 'reject', reason: '' })} disabled={payBusy}>Reject payment</Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-stone">No bKash payment recorded for this order.</p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-stone">Items</p>
                            <ul className="mt-1 space-y-1 text-sm">
                              {(order.items || []).map((i, idx) => (
                                <li key={idx} className="flex justify-between gap-3 text-ink"><span className="truncate">{i.name} × {i.qty}</span><span className="shrink-0 text-stone">{formatPrice((Number(i.unit_price) || 0) * (Number(i.qty) || 0))}</span></li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-xl border border-line p-4">
                            <p className="text-xs uppercase tracking-wide text-stone">Charges (you set these)</p>
                            <div className="mt-3 grid grid-cols-3 gap-3">
                              <label className="text-xs text-stone">Delivery ৳<Input className="mt-1 h-9" inputMode="numeric" value={draft.delivery_charge} onChange={(e) => setDraft((d) => ({ ...d, delivery_charge: e.target.value.replace(/[^0-9.]/g, '') }))} /></label>
                              <label className="text-xs text-stone">Discount ৳<Input className="mt-1 h-9" inputMode="numeric" value={draft.discount} onChange={(e) => setDraft((d) => ({ ...d, discount: e.target.value.replace(/[^0-9.]/g, '') }))} /></label>
                              <label className="text-xs text-stone">Weight kg<Input className="mt-1 h-9" inputMode="decimal" value={draft.weight_kg} onChange={(e) => setDraft((d) => ({ ...d, weight_kg: e.target.value.replace(/[^0-9.]/g, '') }))} /></label>
                            </div>
                            <div className="mt-3 space-y-1 text-sm">
                              <div className="flex justify-between text-stone"><span>Subtotal</span><span>{formatPrice(t.subtotal)}</span></div>
                              <div className="flex justify-between font-semibold text-ink"><span>COD total</span><span>{formatPrice(t.cod_amount)}</span></div>
                            </div>
                            <Button variant="ghost" size="sm" className="mt-3" onClick={() => saveMoney(order)} disabled={savingMoney}>{savingMoney ? 'Saving…' : 'Save charges'}</Button>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-stone">Order status</p>
                            <Select className="mt-2 h-9" value={order.status} onChange={(e) => changeStatus(order, e.target.value)} aria-label="Order status">
                              {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </Select>
                          </div>
                        </div>

                        {/* Right: courier + timeline */}
                        <div className="space-y-5">
                          <div className="rounded-xl border border-line p-4">
                            <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-clay" /><p className="font-display font-semibold text-ink">Steadfast courier</p></div>
                            {created ? (
                              <div className="mt-3 space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-ink"><CheckCircle2 className="h-4 w-4 text-clay" /> Parcel created</div>
                                <div className="flex justify-between"><span className="text-stone">Consignment ID</span><span className="font-medium text-ink">{order.steadfast_consignment_id}</span></div>
                                <div className="flex justify-between"><span className="text-stone">Tracking code</span><span className="font-medium text-ink">{order.steadfast_tracking_code || '—'}</span></div>
                                <div className="flex justify-between"><span className="text-stone">Status</span><CourierBadge order={order} /></div>
                                {order.steadfast_created_at && <div className="flex justify-between"><span className="text-stone">Created</span><span className="text-stone">{fmtDate(order.steadfast_created_at)}</span></div>}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {order.steadfast_tracking_code && (
                                    <a href={trackingUrlFor(order.steadfast_tracking_code)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-clay/40 hover:text-clay"><ExternalLink className="h-3.5 w-3.5" /> Track shipment</a>
                                  )}
                                  <Button variant="ghost" size="sm" onClick={() => refreshStatus(order)} disabled={refreshingId === order.id}>{refreshingId === order.id ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Refreshing…</> : <><RefreshCw className="h-3.5 w-3.5" /> Refresh status</>}</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3">
                                <p className="text-sm text-stone">No parcel yet. Confirm the charges above, then create the courier parcel.</p>
                                <Button className="mt-3" onClick={() => setConfirmOrder(order)}><PackagePlus className="h-4 w-4" /> Create Steadfast Parcel</Button>
                              </div>
                            )}
                          </div>

                          {/* Invoice */}
                          <div className="rounded-xl border border-line p-4">
                            <div className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-clay" /><p className="font-display font-semibold text-ink">Invoice</p></div>
                            {invoice ? (
                              <div className="mt-3 space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-ink">{invoice.invoice_number}</span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-clay/10 px-2.5 py-0.5 text-xs font-medium text-clay"><CheckCircle2 className="h-3.5 w-3.5" /> Generated</span>
                                </div>

                                {/* Manual payment control */}
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="text-xs text-stone">Payment status
                                    <Select className="mt-1 h-9" value={payDraft.payment_status} onChange={(e) => setPayDraft((d) => ({ ...d, payment_status: e.target.value }))}>
                                      {PAYMENT_STATUSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </Select>
                                  </label>
                                  <label className="text-xs text-stone">Method
                                    <Select className="mt-1 h-9" value={payDraft.payment_method} onChange={(e) => setPayDraft((d) => ({ ...d, payment_method: e.target.value }))}>
                                      {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </Select>
                                  </label>
                                </div>
                                {(payDraft.payment_status === 'partial' || payDraft.payment_status === 'paid') && (
                                  <label className="block text-xs text-stone">Paid amount ৳
                                    <Input className="mt-1 h-9" inputMode="numeric" value={payDraft.paid_amount}
                                      onChange={(e) => setPayDraft((d) => ({ ...d, paid_amount: e.target.value.replace(/[^0-9.]/g, '') }))} />
                                  </label>
                                )}
                                {(() => { const m = invoiceMoney({ ...invoice, paid_amount: payDraft.paid_amount }); return (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-stone"><span>Total</span><span className="font-medium text-ink">{formatPrice(m.total)}</span></div>
                                    {m.paid > 0 && <div className="flex justify-between text-stone"><span>Paid</span><span>{formatPrice(m.paid)}</span></div>}
                                    {m.paid > 0 && <div className="flex justify-between"><span className="font-medium text-clay">Due</span><span className="font-medium text-clay">{formatPrice(m.due)}</span></div>}
                                  </div>
                                ) })()}
                                <Button variant="ghost" size="sm" onClick={saveInvoicePayment} disabled={invBusy}>{invBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Save payment</Button>

                                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                                  <Button size="sm" variant="ghost" onClick={() => openPreview(order)}><FileText className="h-3.5 w-3.5" /> View</Button>
                                  <Button size="sm" variant="ghost" onClick={() => downloadInvoice(order)} disabled={invBusy}><Download className="h-3.5 w-3.5" /> Download PDF</Button>
                                  <Button size="sm" variant="ghost" onClick={() => openPreview(order, true)}><Printer className="h-3.5 w-3.5" /> Print</Button>
                                  <Button size="sm" variant="ghost" onClick={() => shareInvoice(order)}><Share2 className="h-3.5 w-3.5" /> Share</Button>
                                </div>
                              </div>
                            ) : order.status === 'confirmed' ? (
                              <div className="mt-3">
                                <p className="text-sm text-stone">This order is confirmed but has no invoice yet.</p>
                                <Button className="mt-3" size="sm" onClick={() => onGenerateInvoice(order)} disabled={invBusy}>{invBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><ReceiptText className="h-4 w-4" /> Generate invoice</>}</Button>
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-stone">An invoice is generated automatically when you confirm this order.</p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-stone">Timeline</p>
                            <ul className="mt-2 space-y-2 text-sm">
                              <li className="flex gap-2 text-stone"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" /> Order created · {fmtDate(order.created_at)}</li>
                              {events.map((ev) => (
                                <li key={ev.id} className="flex gap-2 text-stone"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay/50" /> {ev.message} · {fmtDate(ev.created_at)}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="mx-5 mb-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                        {order.status !== 'cancelled' && (
                          <Button variant="ghost" size="sm" onClick={() => cancelOrder(order)}><Ban className="h-3.5 w-3.5" /> Cancel order</Button>
                        )}
                        {order.steadfast_consignment_id ? (
                          <span className="text-xs text-stone">Has a Steadfast parcel — cancel instead of delete (Steadfast has no delete API).</span>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => removeOrder(order)}><Trash2 className="h-3.5 w-3.5" /> Delete order</Button>
                        )}
                      </div>

                      {rowError && <p className="mx-5 mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{rowError}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* Create parcel confirmation modal */}
      <AnimatePresence>
        {confirmOrder && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => !creating && setConfirmOrder(null)}>
            <motion.div className="w-full max-w-md rounded-2xl border border-line bg-paper p-6" initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ duration: 0.18 }} onClick={(e) => e.stopPropagation()}>
              <h2 className="font-display text-lg font-semibold text-ink">Create Steadfast parcel?</h2>
              <div className="mt-4 space-y-1.5 rounded-xl border border-line bg-cream p-4 text-sm">
                <div className="flex justify-between gap-3"><span className="text-stone">Customer</span><span className="font-medium text-ink">{confirmOrder.customer_name}</span></div>
                <div className="flex justify-between gap-3"><span className="text-stone">Phone</span><span className="font-medium text-ink">{confirmOrder.customer_phone}</span></div>
                <div className="flex justify-between gap-3"><span className="text-stone">Address</span><span className="ml-4 text-right font-medium text-ink">{confirmOrder.customer_address}</span></div>
                <div className="flex justify-between gap-3"><span className="text-stone">Items</span><span className="ml-4 text-right font-medium text-ink">{(confirmOrder.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ')}</span></div>
                <div className="flex justify-between gap-3"><span className="text-stone">COD</span><span className="font-medium text-ink">{formatPrice(confirmOrder.cod_amount)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-stone">Weight</span><span className="font-medium text-ink">{confirmOrder.weight_kg} KG</span></div>
              </div>
              {rowError && <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{rowError}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setConfirmOrder(null)} disabled={creating}>Cancel</Button>
                <Button onClick={() => createParcel(confirmOrder)} disabled={creating}>{creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create parcel'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice preview modal (prints only the sheet — see globals.css) */}
      <AnimatePresence>
        {preview && (
          <motion.div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setPreview(null)}>
            <div className="mx-auto my-4 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="no-print mb-3 flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print</Button>
                  <Button size="sm" variant="ghost" onClick={() => downloadInvoice(preview.order)} disabled={invBusy}><Download className="h-3.5 w-3.5" /> Download PDF</Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setPreview(null)}><X className="h-3.5 w-3.5" /> Close</Button>
              </div>
              <div className="invoice-print-area overflow-hidden rounded-2xl border border-line shadow-2xl">
                <InvoicePreview invoice={preview.invoice} order={preview.order} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual bKash payment decision — human verification only, never automatic. */}
      <AnimatePresence>
        {payConfirm && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => !payBusy && setPayConfirm(null)}>
            <motion.div className="w-full max-w-md rounded-2xl border border-line bg-paper p-6" initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ duration: 0.18 }} onClick={(e) => e.stopPropagation()}>
              {payConfirm.action === 'verify' ? (
                <>
                  <h2 className="font-display text-lg font-semibold text-ink">Have you manually verified this bKash payment?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-stone">Only confirm after you have checked bKash yourself and received {formatPrice(payment?.amount)} at {payment?.receiver_number}. This marks the payment as <span className="font-medium text-ink">Paid</span> and confirms the order.</p>
                  <div className="mt-3 space-y-1.5 rounded-xl border border-line bg-cream p-3 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-stone">Transaction ID</span><span className="font-medium text-ink">{payment?.transaction_id}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-stone">Amount</span><span className="font-medium text-ink">{formatPrice(payment?.amount)}</span></div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setPayConfirm(null)} disabled={payBusy}>Cancel</Button>
                    <Button onClick={runPayConfirm} disabled={payBusy}>{payBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Confirming…</> : <><CheckCircle2 className="h-4 w-4" /> Confirm Payment</>}</Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-display text-lg font-semibold text-ink">Reject this payment?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-stone">The payment will be marked <span className="font-medium text-ink">Rejected</span>. Add a reason if you like (optional).</p>
                  <Input className="mt-3" placeholder="e.g. Transaction ID does not match the received payment" value={payConfirm.reason || ''} onChange={(e) => setPayConfirm((p) => ({ ...p, reason: e.target.value }))} />
                  <div className="mt-5 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setPayConfirm(null)} disabled={payBusy}>Cancel</Button>
                    <Button onClick={runPayConfirm} disabled={payBusy} style={{ backgroundColor: '#B4381F' }}>{payBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Rejecting…</> : <><Ban className="h-4 w-4" /> Reject payment</>}</Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
