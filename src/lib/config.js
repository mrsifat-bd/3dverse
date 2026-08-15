// Central business/contact info + categories. Edit here; used site-wide.
export const BUSINESS = {
  name: '3D Verse',
  owner: 'Maksudur Rahman Rahat',
  location: 'Sylhet, Bangladesh',
  email: '3dverse.bd@gmail.com',
  phone: '+8801357141040',
  whatsappNumber: '8801357141040',
  tagline: 'Custom 3D printed products, made in Sylhet.',
  description:
    '3D Verse designs and 3D-prints made-to-order products from our studio in Sylhet, Bangladesh — anatomical and bone models for students and clinics, custom keyrings, home decor, and personalised gifts. Every piece is printed on demand, so we can tailor size, colour, and detail to exactly what you need.',
  social: {
    facebook: 'https://www.facebook.com/3dversebd',
    instagram: 'https://www.instagram.com/3dversebd/',
    tiktok: 'https://www.tiktok.com/@3dversebd',
    youtube: 'https://www.youtube.com/@3DVerseBD',
    telegram: 'https://t.me/verse3d',
  },
}

// Canonical public URL — used ONLY for metadata/OG tags, sitemap, robots,
// JSON-LD and the WhatsApp product link. Never for routing or API calls.
// Set NEXT_PUBLIC_SITE_URL in Vercel (Production) to override; falls back to
// the live custom domain.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://3dversebd.com'

// Review / demo video playlist, shown on Medical & Bone Models product pages.
export const REVIEW_URL = 'https://www.youtube.com/watch?v=gKxe9yfNt8c&list=PLTfEbDVspMGw'

export const CATEGORIES = [
  { slug: 'medical-bone-models', name: 'Medical & Bone Models', blurb: 'Anatomical skull parts, vertebrae, skeletons and study sets for students and clinics.' },
  { slug: 'gadgets', name: 'Gadgets', blurb: 'Mounts, cases, racks and functional tech accessories.' },
  { slug: 'aquarium', name: 'Aquarium', blurb: 'Decorative caves, formations and aquascaping pieces.' },
  { slug: 'desk-accessories', name: 'Desk & Accessories', blurb: 'Pen holders, stands, organisers and everyday desk essentials.' },
  { slug: 'home-decor', name: 'Home Decor', blurb: 'Wall art, decor and sculptural pieces for the home.' },
  { slug: 'gifts', name: 'Gifts', blurb: 'Thoughtful, made-to-order gifts for every occasion.' },
]

export function categoryName(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.name || slug
}

// Admin allowlist for CLIENT-side gating (hiding admin UI from customers).
// These are just emails (not secrets). The real enforcement is server-side RLS
// (public.is_admin / admin_emails) and requireAdmin(). Keep this in sync.
export const ADMIN_EMAILS_PUBLIC = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '3dverse.bd@gmail.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export function isAdminEmail(email) {
  return ADMIN_EMAILS_PUBLIC.includes(String(email || '').toLowerCase())
}

// bKash delivery-charge prepayment (manual Send Money + admin verification).
export const BKASH = {
  number: '01846195474',
  type: 'Send Money',
}
