import { describe, it, expect } from 'vitest'
import { orderErrorKey } from '../orderErrors'
import { clampQty, MAX_QTY } from '../cart'

describe('order error mapping for the hardened database', () => {
  it('maps rate limits and quantity/item errors to friendly translated keys', () => {
    expect(orderErrorKey('RATE_LIMITED')).toBe('checkout.rateLimited')
    expect(orderErrorKey('INVALID_QUANTITY')).toBe('checkout.quantityInvalid')
    expect(orderErrorKey('INVALID_ITEMS: too many lines')).toBe('checkout.cartProblem')
  })
  it('never shows raw technical text', () => {
    expect(orderErrorKey('permission denied for function x')).toBe('checkout.failed')
  })
})

describe('cart quantity clamp (same ceiling as place_order)', () => {
  it('keeps whole numbers between 1 and 1000', () => {
    expect(MAX_QTY).toBe(1000)
    expect(clampQty(20)).toBe(20)
    expect(clampQty('50')).toBe(50)
    expect(clampQty(0)).toBe(1)
    expect(clampQty(-4)).toBe(1)
    expect(clampQty(2.6)).toBe(3)
    expect(clampQty(5000)).toBe(1000)
    expect(clampQty('abc')).toBe(1)
  })
})

import { invoiceChargesPatch } from '@/lib/invoices'
describe('invoice follows changed charges', () => {
  it('recomputes total like the DB (subtotal + delivery - discount, min 0)', () => {
    expect(invoiceChargesPatch({ subtotal: 65400, delivery_charge: 600, discount: 1000 })).toEqual({ subtotal: 65400, delivery_charge: 600, discount: 1000, total: 65000 })
    expect(invoiceChargesPatch({ subtotal: 100, delivery_charge: 0, discount: 500 }).total).toBe(0)
    expect(invoiceChargesPatch({ subtotal: '200', delivery_charge: '', discount: null })).toEqual({ subtotal: 200, delivery_charge: 0, discount: 0, total: 200 })
  })
})

import { computeTotals, isDeliveryPrepaid, codForOrder } from '@/lib/orders'
describe('courier COD amount (delivery paid by bKash on website orders)', () => {
  const items = [{ unit_price: 1200, qty: 1 }, { unit_price: 2100, qty: 1 }]
  it('website order: courier collects product price only', () => {
    const web = { user_id: 'u1', payment_status: 'verified', items, delivery_charge: 120, discount: 0 }
    expect(isDeliveryPrepaid(web)).toBe(true)
    expect(codForOrder(web)).toBe(3300)
    expect(computeTotals({ items, delivery_charge: 120, discount: 0, deliveryPrepaid: true })).toEqual({ subtotal: 3300, total: 3420, cod_amount: 3300 })
  })
  it('website order with a discount: discount comes off the cash amount', () => {
    expect(codForOrder({ user_id: 'u1', payment_status: 'verified', items, delivery_charge: 120, discount: 300 })).toBe(3000)
  })
  it('manual admin order (no customer account): courier collects everything', () => {
    const manual = { user_id: null, payment_status: 'pending', items, delivery_charge: 120, discount: 0 }
    expect(isDeliveryPrepaid(manual)).toBe(false)
    expect(codForOrder(manual)).toBe(3420)
  })
  it('rejected bKash payment: delivery is collected in cash too', () => {
    expect(codForOrder({ user_id: 'u1', payment_status: 'rejected', items, delivery_charge: 120, discount: 0 })).toBe(3420)
  })
  it('never negative', () => {
    expect(codForOrder({ user_id: 'u1', payment_status: 'verified', items: [{ unit_price: 100, qty: 1 }], delivery_charge: 70, discount: 500 })).toBe(0)
  })
})

import { parseTags, tagText } from '@/lib/format'
import { searchProducts } from '@/lib/products'
describe('product tags accept #hashtags', () => {
  it('parses commas, hashtags and mixes', () => {
    expect(parseTags('skull, anatomy, medical')).toEqual(['skull', 'anatomy', 'medical'])
    expect(parseTags('#skull #anatomy #medical')).toEqual(['skull', 'anatomy', 'medical'])
    expect(parseTags('#skull, bone model,#Skull')).toEqual(['skull', 'bone model'])
    expect(parseTags(['#a', 'b'])).toEqual(['a', 'b'])
    expect(parseTags('  ,  # ,')).toEqual([])
  })
  it('shows old "#tag" values once and searches by #tag', () => {
    expect(tagText('##skull')).toBe('skull')
    const list = [{ name: 'X', tags: ['skull'] }, { name: 'Y', tags: ['pen'] }]
    expect(searchProducts(list, '#skull').map((p) => p.name)).toEqual(['X'])
  })
})
