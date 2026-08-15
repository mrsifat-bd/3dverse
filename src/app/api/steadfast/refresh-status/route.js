import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverSupabase'
import { statusByConsignmentId, steadfastConfigured } from '@/lib/steadfast'
import { mapSteadfastToOrderStatus, steadfastStatusLabel } from '@/lib/orders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  const auth = await requireAdmin(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!steadfastConfigured()) {
    return NextResponse.json({ error: 'Steadfast is not configured on the server.' }, { status: 503 })
  }

  let input
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }
  const orderId = input?.orderId
  if (!orderId) return NextResponse.json({ error: 'Missing orderId.' }, { status: 400 })

  const { supabase, user } = auth
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, steadfast_consignment_id')
    .eq('id', orderId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load order.' }, { status: 500 })
  if (!order?.steadfast_consignment_id) {
    return NextResponse.json({ error: 'This order has no Steadfast consignment yet.' }, { status: 422 })
  }

  const result = await statusByConsignmentId(order.steadfast_consignment_id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Could not fetch courier status.' }, { status: 502 })
  }

  const deliveryStatus = result.data?.delivery_status || 'unknown'
  const nowIso = new Date().toISOString()
  await supabase
    .from('orders')
    .update({
      steadfast_status: deliveryStatus,
      steadfast_updated_at: nowIso,
      status: mapSteadfastToOrderStatus(deliveryStatus),
    })
    .eq('id', orderId)
  await supabase.from('order_events').insert({
    order_id: orderId,
    type: 'status',
    message: `Courier status: ${steadfastStatusLabel(deliveryStatus)}`,
    actor: user.email || '',
  })

  return NextResponse.json({ ok: true, delivery_status: deliveryStatus })
}
