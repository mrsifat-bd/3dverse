// The checkout backend (place_order) and the bKash format check return English
// sentences. Map the known ones to translation keys; anything unexpected gets a
// generic, translated message instead of raw technical text.
export function txnErrorKey(message = '') {
  return /enter your bkash/i.test(message) ? 'checkout.txnRequired' : 'checkout.txnInvalid'
}

export function orderErrorKey(message = '') {
  const m = String(message).toLowerCase()
  if (m.includes('rate_limited')) return 'checkout.rateLimited'
  if (m.includes('invalid_quantity')) return 'checkout.quantityInvalid'
  if (m.includes('invalid_items')) return 'checkout.cartProblem'
  if (m.includes('enter your bkash')) return 'checkout.txnRequired'
  if (m.includes('bkash transaction')) return 'checkout.txnInvalid'
  if (m.includes('already') && m.includes('transaction')) return 'checkout.txnUsed'
  if (m.includes('logged in')) return 'checkout.loginRequired'
  if (m.includes('phone')) return 'form.phoneInvalid'
  if (m.includes('name and address') || m.includes('address')) return 'form.addressShort'
  if (m.includes('cart is empty') || m.includes('no valid products')) return 'checkout.cartProblem'
  if (m.includes('police') || m.includes('thana')) return 'form.thanaRequired'
  return 'checkout.failed'
}
