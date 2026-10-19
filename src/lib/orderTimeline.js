// Turns the order timeline (order_events, written in English by the database
// and the admin panel) into customer-facing lines in the page language.
// Known messages are translated; internal ones (courier API errors, notes)
// are hidden from customers; anything unrecognised is shown as written
// (marked as English) so no information is lost.

const STATUS_BY_LABEL = {
  'awaiting verification': 'new', new: 'new', confirmed: 'confirmed', 'ready for delivery': 'ready', ready: 'ready',
  'handed to courier': 'sent_to_steadfast', 'sent to steadfast': 'sent_to_steadfast', shipped: 'shipped',
  delivered: 'delivered', cancelled: 'cancelled', returned: 'returned', failed: 'failed',
}
const COURIER_BY_LABEL = {
  pending: 'pending', 'in review': 'in_review', 'on hold': 'hold', delivered: 'delivered',
  'partially delivered': 'partial_delivered', cancelled: 'cancelled',
  'delivered (approval pending)': 'delivered_approval_pending', 'partial (approval pending)': 'partial_delivered_approval_pending',
  'cancelled (approval pending)': 'cancelled_approval_pending', 'unknown (approval pending)': 'unknown_approval_pending',
  unknown: 'unknown', 'not created': 'none',
}

const COURIER_KEYS = new Set(Object.values(COURIER_BY_LABEL))

export function courierLabel(t, value) {
  if (!value) return t('orders.courier.none')
  const key = COURIER_BY_LABEL[String(value).toLowerCase()] || String(value)
  return COURIER_KEYS.has(key) ? t(`orders.courier.${key}`) : String(value)
}

// Returns { text, lang } or null (hidden from customers).
export function customerEvent(ev, t) {
  const msg = String(ev?.message || '').trim()
  const type = ev?.type || ''
  if (!msg || type === 'error' || type === 'note' || /failed/i.test(msg)) return null
  let m
  if ((m = msg.match(/^Order placed\. bKash txn (\S+)/i))) return { text: t('orders.ev.placed', { txn: m[1] }) }
  if ((m = msg.match(/^Status set to (.+?)\.?$/i))) {
    const key = STATUS_BY_LABEL[m[1].toLowerCase()]
    return key ? { text: t('orders.ev.status', { status: t(`orders.status.${key}`) }) } : { text: msg, lang: 'en' }
  }
  if (/^Payment manually verified/i.test(msg)) return { text: t('orders.ev.verified') }
  if ((m = msg.match(/^Payment rejected by admin[^:]*(?::\s*(.+))?$/i))) {
    return m[1] ? { text: t('orders.ev.rejectedReason', { reason: m[1] }) } : { text: t('orders.ev.rejected') }
  }
  if (/^Cancelled by the customer/i.test(msg)) return { text: t('orders.ev.cancelledByYou') }
  if (/^Order cancelled by admin/i.test(msg)) return { text: t('orders.ev.cancelledByUs') }
  if ((m = msg.match(/^Invoice generated:\s*(\S+)/i))) return { text: t('orders.ev.invoice', { n: m[1] }) }
  if ((m = msg.match(/^Steadfast parcel created.*tracking\s+(\S+)/i))) return { text: t('orders.ev.courierCreated', { code: m[1] }) }
  if ((m = msg.match(/^Courier status:\s*(.+)$/i))) return { text: t('orders.ev.courierStatus', { status: courierLabel(t, m[1]) }) }
  if (/^Order added manually by admin/i.test(msg)) return { text: t('orders.ev.addedByTeam') }
  return { text: msg, lang: 'en' }
}
