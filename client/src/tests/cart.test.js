import { describe, it } from 'node:test'
import assert from 'node:assert'

// Cart calculation helper logic tested in isolation
function calculateCartTotals(cart) {
  const cartItems = Object.entries(cart)
    .map(([id, entry]) => ({
      ...(entry?.product || {}),
      productId: id,
      qty: entry?.qty || 0,
    }))
    .filter((item) => item.productId && item.qty > 0)

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0)
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0)

  return { cartItems, cartTotal, cartCount }
}

describe('Frontend Cart Calculation & State Unit Tests', () => {
  it('calculates subtotals and total count correctly for multiple items', () => {
    const mockCart = {
      p1: { product: { _id: 'p1', name: 'Rice 25kg', price: 1000 }, qty: 2 },
      p2: { product: { _id: 'p2', name: 'Oil 5L', price: 500 }, qty: 3 },
    }

    const { cartItems, cartTotal, cartCount } = calculateCartTotals(mockCart)

    assert.strictEqual(cartItems.length, 2)
    assert.strictEqual(cartCount, 5)
    assert.strictEqual(cartTotal, 3500) // (1000 * 2) + (500 * 3)
  })

  it('filters out items with 0 quantity from cart totals', () => {
    const mockCart = {
      p1: { product: { _id: 'p1', name: 'Rice 25kg', price: 1000 }, qty: 0 },
      p2: { product: { _id: 'p2', name: 'Oil 5L', price: 500 }, qty: 1 },
    }

    const { cartItems, cartTotal, cartCount } = calculateCartTotals(mockCart)

    assert.strictEqual(cartItems.length, 1)
    assert.strictEqual(cartCount, 1)
    assert.strictEqual(cartTotal, 500)
  })
})
