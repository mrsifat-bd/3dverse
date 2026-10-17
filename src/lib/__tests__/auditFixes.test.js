import { describe, it, expect } from 'vitest'
import { productSeoTitle, toListProduct } from '../products'
import { categoryName, prettifySlug } from '../config'
import { localDeliveryCharge, isSylhetCity } from '../delivery'
import { cardImage } from '../format'
import { nonEmptyCategories } from '../categories'

describe('SEO product titles', () => {
  it('adds "Model" for medical items and "3D Printed" when missing', () => {
    expect(productSeoTitle({ name: 'Human Heart', category: 'medical-bone-models' })).toBe('Human Heart Model 3D Printed')
    expect(productSeoTitle({ name: 'Full Set Bones', category: 'medical-bone-models' })).toBe('Full Set Bones 3D Printed')
    expect(productSeoTitle({ name: 'Laptop Stand', category: 'desk-accessories' })).toBe('Laptop Stand 3D Printed')
    expect(productSeoTitle({ name: '3D Logo Sign', category: 'gifts' })).toBe('3D Logo Sign')
  })
})

describe('category names', () => {
  it('never shows a raw slug', () => {
    expect(prettifySlug('desktop-accessories')).toBe('Desktop Accessories')
    expect(categoryName('pen-holder')).toBe('Pen Holder')
    expect(categoryName('islamic-items', { 'islamic-items': 'Islamic Items' })).toBe('Islamic Items')
    expect(toListProduct({ id: 1, category: 'phone-stand' }, { 'phone-stand': 'Phone Stand' }).category_name).toBe('Phone Stand')
  })
  it('hides empty categories but keeps the built-in fallback list', () => {
    expect(nonEmptyCategories([{ slug: 'a', product_count: 0 }, { slug: 'b', product_count: 3 }]).map((c) => c.slug)).toEqual(['b'])
    expect(nonEmptyCategories([{ slug: 'x' }]).length).toBe(1)
  })
})

describe('delivery zones (mirror of compute_delivery_charge_zone)', () => {
  it('charges Sylhet city ৳50 less on every tier', () => {
    expect(isSylhetCity('Sylhet Sadar, Sylhet')).toBe(true)
    expect(isSylhetCity('Dakshinsurma, Sylhet')).toBe(true)
    expect(isSylhetCity('Beanibazar, Sylhet')).toBe(false)
    expect(localDeliveryCharge(0.3, 'Sylhet Sadar, Sylhet')).toBe(70)
    expect(localDeliveryCharge(0.3, 'Mirpur, Dhaka')).toBe(120)
    expect(localDeliveryCharge(0.3)).toBe(120)
    expect(localDeliveryCharge(1.5, 'Sylhet Sadar, Sylhet')).toBe(160)
    expect(localDeliveryCharge(4, 'Mirpur, Dhaka')).toBe(270)
  })
})

describe('review photo card variant', () => {
  it('maps processed review photos to their -640 version', () => {
    const u = 'https://x.supabase.co/storage/v1/object/public/review-photos/reviews/0b3a5c1e-1111-2222-3333-444455556666/0123456789abcdef0123456789abcdef.webp'
    expect(cardImage(u)).toBe(u.replace('.webp', '-640.webp'))
  })
})
