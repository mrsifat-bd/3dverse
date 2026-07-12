// Central business/contact info + categories. Edit here; used site-wide.
export const BUSINESS = {
  name: '3DVerse',
  owner: 'Maksudur Rahman Rahat',
  location: 'Sylhet, Bangladesh',
  email: '3dverse.bd@gmail.com',
  phone: '+8801357141040',
  whatsappNumber: '8801357141040',
  tagline: 'Custom 3D printed products, made in Sylhet.',
  description:
    '3DVerse designs and 3D-prints made-to-order products from our studio in Sylhet, Bangladesh — anatomical and bone models for students and clinics, custom keyrings, home decor, and personalised gifts. Every piece is printed on demand, so we can tailor size, colour, and detail to exactly what you need.',
  social: {
    facebook: 'https://www.facebook.com/3dversebd',
    instagram: 'https://www.instagram.com/3dversebd/',
    tiktok: 'https://www.tiktok.com/@3dversebd',
    youtube: 'https://www.youtube.com/@3DVerseBD',
    telegram: 'https://t.me/verse3d',
  },
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'

export const CATEGORIES = [
  { slug: 'bone-models', name: 'Anatomical & Bone Models', blurb: 'Life-size and study models for students, clinics and collectors.' },
  { slug: 'keyrings', name: 'Custom Keyrings', blurb: 'Personalised names, logos and shapes in durable print.' },
  { slug: 'home-decor', name: 'Home Decor', blurb: 'Vases, planters, lamps and sculptural pieces.' },
  { slug: 'gifts', name: 'Gifts', blurb: 'Thoughtful, made-to-order gifts for every occasion.' },
  { slug: 'miscellaneous', name: 'Miscellaneous', blurb: 'Tools, gadgets and one-off custom prints.' },
]

export function categoryName(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.name || slug
}
