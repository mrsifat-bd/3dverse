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
