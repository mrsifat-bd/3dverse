// Supabase auth errors arrive as English sentences. Map the ones customers can
// actually hit to translated messages; anything else gets a generic message
// (never a raw technical string on screen).
export function authErrorKey(message = '') {
  const m = String(message).toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user already exists')) return 'auth.emailTaken'
  if (m.includes('password') && (m.includes('at least') || m.includes('weak') || m.includes('short'))) return 'auth.passwordShort'
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) return 'auth.rateLimited'
  if (m.includes('invalid email') || m.includes('email address') && m.includes('invalid')) return 'subscribe.invalidEmail'
  if (m.includes('same') && m.includes('password')) return 'auth.samePassword'
  if (m.includes('session') || m.includes('expired') || m.includes('jwt')) return 'auth.linkExpired'
  return 'common.error'
}
