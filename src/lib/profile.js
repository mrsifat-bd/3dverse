import { supabase, AVATARS_BUCKET } from './supabaseClient'

// Uploads an avatar image to the user's own folder and saves its public URL
// on the profile. Returns the new URL.
export async function uploadAvatar(file) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  if (!file.type?.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB.')

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${user.id}/avatar-${Date.now()}.${ext}`
  const { error: upErr } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file, { upsert: true, cacheControl: '3600' })
  if (upErr) throw upErr
  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
  const url = data.publicUrl
  const { error } = await supabase.from('profiles').upsert({ user_id: user.id, avatar_url: url }, { onConflict: 'user_id' })
  if (error) throw error
  return url
}

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }
  const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()
  return { user, profile: data || { full_name: '', phone: '', default_address: '' } }
}

export async function updateMyProfile(patch) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  const clean = {
    full_name: (patch.full_name || '').trim(),
    phone: (patch.phone || '').trim(),
    default_address: (patch.default_address || '').trim(),
  }
  // Upsert so it works even if the profile row wasn't created by the trigger.
  const { error } = await supabase.from('profiles').upsert({ user_id: user.id, ...clean }, { onConflict: 'user_id' })
  if (error) throw error
  return clean
}
