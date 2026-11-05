// November 2026: "Medical & Bone Models" was split into two categories,
// Medical and Bones. This file is the single source of truth for that split:
// the database migration (scripts/gen-category-split-migration.mjs) is
// generated from it, and the old URL redirects to Bones (next.config.mjs).
//
// Every product of the old category goes to Bones except the ones listed in
// MEDICAL_PRODUCT_SLUGS. No product is duplicated, deleted or edited apart
// from its category.

export const OLD_CATEGORY = 'medical-bone-models'

export const NEW_CATEGORIES = [
  {
    slug: 'medical',
    name: 'Medical',
    name_bn: 'মেডিকেল',
    blurb: 'Anatomy models, organ models and accessories for medical and dental students, doctors and clinics.',
  },
  {
    slug: 'bones',
    name: 'Bones',
    name_bn: 'হাড়',
    blurb: 'Individual human bones, vertebrae, ribs, skull bones, complete bone sets and skeletons for study.',
  },
]

// The owner's classification (6 Nov 2026). Everything else -> Bones.
export const MEDICAL_PRODUCT_SLUGS = [
  'dental-model-foldable',
  'dental-tool-holder',
  'digestive-system-model',
  'doctor-key-ring',
  'doctor-pen-holder',
  'human-brain-with-stand',
  'human-heart',
  'human-heart-with-stand',
  'human-lungs',
  'skeleton-hand-bookstop',
  'sthetocap-cover-combo-basic',
]

export const splitTarget = (productSlug) => (MEDICAL_PRODUCT_SLUGS.includes(productSlug) ? 'medical' : 'bones')

// Old category URLs that now redirect. A redirected category is never listed.
export const CATEGORY_REDIRECTS = { [OLD_CATEGORY]: 'bones' }

// Shown first in the shop's category list (then the rest, most products first).
export const PINNED_CATEGORIES = ['medical', 'bones']

// Preview deployments only (env flag set for the Vercel Preview environment):
// show the split from this file while the live database still has the old
// category, so the change can be reviewed on real products before the
// migration runs. Production never sets this flag.
export const PREVIEW_SPLIT = process.env.NEXT_PUBLIC_CATEGORY_SPLIT_PREVIEW === '1'

// Preview only: a product of the old category, seen as it will be after the
// migration (same object otherwise).
export function previewProduct(p) {
  if (!PREVIEW_SPLIT || !p) return p
  const extra = Array.isArray(p.extra_categories) ? p.extra_categories : null
  const target = splitTarget(p.slug)
  return {
    ...p,
    category: p.category === OLD_CATEGORY ? target : p.category,
    ...(extra ? { extra_categories: extra.map((c) => (c === OLD_CATEGORY ? target : c)) } : {}),
  }
}

// Final category list: redirected categories dropped; preview adds the new
// categories (with counts) when the database does not have them yet; Medical
// and Bones first, the rest in their existing order.
export function arrangeCategories(cats, products = null) {
  let list = (cats || []).filter((c) => !CATEGORY_REDIRECTS[c.slug])
  if (PREVIEW_SPLIT && products && !list.some((c) => c.slug === 'bones')) {
    const counted = NEW_CATEGORIES.map((c) => ({
      ...c,
      id: `preview-${c.slug}`,
      status: 'active',
      product_count: products.filter((p) => p.category === c.slug || (p.extra_categories || []).includes(c.slug)).length,
    }))
    list = [...counted, ...list]
  }
  const pinned = PINNED_CATEGORIES.map((s) => list.find((c) => c.slug === s)).filter(Boolean)
  return [...pinned, ...list.filter((c) => !PINNED_CATEGORIES.includes(c.slug))]
}
