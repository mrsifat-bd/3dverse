import { requireAdmin } from '@/lib/serverSupabase'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Admin-only, targeted ISR revalidation. Called after a product/category is
// created/edited/deleted so the new item + image show on the customer pages
// immediately instead of waiting for the 60s revalidate window. Only the
// product-facing routes are invalidated — page caching stays on everywhere else.
export async function POST(req) {
  const auth = await requireAdmin(req)
  if (auth.error) return json({ error: auth.error }, auth.status)
  try {
    revalidatePath('/')
    revalidatePath('/shop')
    revalidatePath('/category/[slug]', 'page')
    revalidatePath('/product/[slug]', 'page')
  } catch {}
  return json({ ok: true })
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } })
}
