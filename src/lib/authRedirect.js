// Open-redirect protection: only allow safe INTERNAL paths as a post-login
// destination. Anything that could navigate off-site (absolute URLs, protocol-
// relative "//evil.com", backslashes, schemes) is rejected in favour of a
// safe fallback. Used by login, signup and the OAuth callback.
export function safeNext(next, fallback = '') {
  if (!next || typeof next !== 'string') return fallback
  const v = next.trim()
  if (!v.startsWith('/')) return fallback // must be an internal path
  if (v.startsWith('//') || v.startsWith('/\\')) return fallback // protocol-relative
  if (v.includes('://') || v.includes('\\')) return fallback // absolute / escaped
  if (/^\/%2f/i.test(v)) return fallback // encoded protocol-relative
  if (/^\/\s*[a-z][a-z0-9+.-]*:/i.test(v)) return fallback // "/javascript:" etc.
  if (/[\u0000-\u001f\u007f]/.test(v)) return fallback // control chars / newlines
  return v
}
