import { supabase } from './supabaseClient'

// Email tasks available per order. `warn` is a soft hint (admin keeps manual
// control); the task is never hard-blocked so it can be sent when appropriate.
export const EMAIL_TASKS = [
  { type: 'ORDER_CONFIRMED', label: 'Order Confirmed', warn: () => '' },
  {
    type: 'SENT_FOR_DELIVERY', label: 'Sent for Delivery',
    warn: (o) => (o.steadfast_consignment_id ? '' : 'Create the Steadfast parcel first to include tracking.'),
  },
  {
    type: 'REVIEW_REQUEST', label: 'Request for Review',
    warn: (o) => (o.status === 'delivered' ? '' : 'Usually sent after the order is delivered.'),
  },
]

export const EMAIL_TASK_LABEL = Object.fromEntries(EMAIL_TASKS.map((t) => [t.type, t.label]))

export async function getOrderEmailEvents(orderId) {
  const { data, error } = await supabase
    .from('order_email_events')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Latest SENT event per type (used to show "already sent" state).
export function lastSentByType(events) {
  const map = {}
  for (const e of events || []) {
    if (e.status === 'sent' && !map[e.email_type]) map[e.email_type] = e
  }
  return map
}
