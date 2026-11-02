import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverSupabase'
import { getBalance, steadfastConfigured } from '@/lib/steadfast'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Admin-only, read-only connection check (asks Steadfast for the account
// balance). Never creates or changes a parcel.
export async function GET(req) {
  const auth = await requireAdmin(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!steadfastConfigured()) {
    return NextResponse.json({ ok: false, error: 'Steadfast keys are missing on the server (STEADFAST_API_KEY / STEADFAST_SECRET_KEY).' })
  }
  const r = await getBalance()
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error || 'Could not reach Steadfast.' })
  const balance = Number(r.data?.current_balance)
  return NextResponse.json({ ok: true, balance: Number.isFinite(balance) ? balance : null })
}
