import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverSupabase'
import { writeBangla } from '@/lib/banglaWriter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Admin-only. Returns a Bangla DRAFT; nothing is saved here (the admin
// reviews it in the product form and saves the product as usual).
export async function POST(req) {
  const auth = await requireAdmin(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  let body
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request.' }, { status: 400 }) }
  const description = String(body?.description || '').trim()
  if (description.length < 10) return NextResponse.json({ error: 'Write the English description first (at least a sentence).' }, { status: 422 })
  const r = await writeBangla({ name: body?.name, description, category: body?.category })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status || 502 })
  return NextResponse.json({ name_bn: r.name_bn, description_bn: r.description_bn })
}
