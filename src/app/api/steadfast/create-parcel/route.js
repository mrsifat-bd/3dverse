import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverSupabase'
import { createConsignment, steadfastConfigured, trackingUrl } from '@/lib/steadfast'
import { isValidBDPhone } from '@/lib/orders'

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
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load order.' }, { status: 500 })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  // Duplicate-shipment guard.
  if (order.steadfast_consignment_id) {
    return NextResponse.json(
      {
        error: 'A Steadfast parcel already exists for this order.',
        already: true,
        consignment_id: order.steadfast_consignment_id,
        tracking_code: order.steadfast_tracking_code,
      },
      { status: 409 }
    )
  }

  // Validate before hitting the courier.
  if (!order.customer_name?.trim() || !order.customer_address?.trim()) {
    return NextResponse.json({ error: 'Order is missing customer name or address.' }, { status: 422 })
  }
  if (!isValidBDPhone(order.customer_phone)) {
    return NextResponse.json({ error: 'Order has an invalid phone number (need 11 digits).' }, { status: 422 })
  }
  const cod = Number(order.cod_amount) || 0
  if (cod < 0) return NextResponse.json({ error: 'Invalid COD amount.' }, { status: 422 })

  const itemDesc = (order.items || []).map((i) => `${i.name} x${i.qty}`).join(', ').slice(0, 250)
  const invoice = order.order_number || `DV-${String(order.id).slice(0, 8)}`

  // Include the police station (thana, district) in the courier address.
  const fullAddress = [order.customer_address, order.police_station].filter((s) => s && String(s).trim()).join(', ').slice(0, 250)

  const result = await createConsignment({
    invoice,
    recipient_name: order.customer_name,
    recipient_phone: order.customer_phone,
    recipient_address: fullAddress,
    cod_amount: cod,
    note: order.note,
    item_description: itemDesc,
  })

  if (!result.ok) {
    // Log securely; keep order status unchanged so the admin can retry safely.
    await supabase.from('order_events').insert({
      order_id: orderId,
      type: 'error',
      message: `Steadfast parcel creation failed: ${result.error}`,
      actor: user.email || '',
    })
    return NextResponse.json(
      { error: result.error || 'Unable to create Steadfast parcel. Please try again.' },
      { status: 502 }
    )
  }

  const c = result.data?.consignment || {}
  const nowIso = new Date().toISOString()
  const patch = {
    steadfast_invoice: invoice,
    steadfast_consignment_id: String(c.consignment_id || ''),
    steadfast_tracking_code: c.tracking_code || '',
    steadfast_status: c.status || 'in_review',
    steadfast_created_at: nowIso,
    steadfast_updated_at: nowIso,
    status: 'sent_to_steadfast',
  }
  await supabase.from('orders').update(patch).eq('id', orderId)
  await supabase.from('order_events').insert({
    order_id: orderId,
    type: 'shipment_created',
    message: `Steadfast parcel created — CID ${patch.steadfast_consignment_id}, tracking ${patch.steadfast_tracking_code}`,
    actor: user.email || '',
  })

  return NextResponse.json({
    ok: true,
    consignment_id: patch.steadfast_consignment_id,
    tracking_code: patch.steadfast_tracking_code,
    status: patch.steadfast_status,
    tracking_url: trackingUrl(patch.steadfast_tracking_code),
  })
}
