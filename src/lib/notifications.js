import { supabase } from './supabaseClient'

// Admin notifications. All reads/writes are RLS-gated to admins (is_admin()),
// so nothing here exposes customer data to non-admins.

export async function getAdminNotifications(limit = 30) {
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('id, order_id, type, title, message, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export function unreadCount(list) {
  return (list || []).filter((n) => !n.read_at).length
}

export async function markNotificationRead(id) {
  const { error } = await supabase
    .from('admin_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null)
  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('admin_notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
  if (error) throw error
}

// Subscribe to new notifications in real time. Returns an unsubscribe fn.
// Falls back silently if Realtime is unavailable — the bell also polls.
export function subscribeAdminNotifications(onInsert) {
  try {
    const channel = supabase
      .channel('admin_notifications_stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, (payload) => {
        if (payload?.new) onInsert(payload.new)
      })
      .subscribe()
    return () => { try { supabase.removeChannel(channel) } catch {} }
  } catch {
    return () => {}
  }
}
