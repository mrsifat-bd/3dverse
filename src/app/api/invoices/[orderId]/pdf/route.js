import { requireUser } from '@/lib/serverSupabase'
import { buildInvoicePdf } from '@/lib/invoicePdfBuild'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req, props) {
  const params = await props.params;
  // Any authenticated user; RLS then limits invoice/order visibility to
  // admins or the order's own customer.
  const auth = await requireUser(req)
  if (auth.error) return jsonError(auth.error, auth.status)

  const orderId = params?.orderId
  if (!orderId) return jsonError('Missing order id.', 400)

  const pdf = await buildInvoicePdf({ supabase: auth.supabase, orderId, origin: new URL(req.url).origin })
  if (pdf.error) return jsonError(pdf.error, pdf.status)

  return new Response(pdf.buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdf.filename}"`,
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
