import { isSupabaseConfigured } from '@/lib/supabaseClient'

// Thin banner shown only in demo mode (no Supabase env vars set).
export default function DemoBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div className="bg-ink text-center text-xs text-paper/90">
      <div className="container py-1.5">
        Demo mode — showing sample products. Connect Supabase to load your real catalog.
      </div>
    </div>
  )
}
