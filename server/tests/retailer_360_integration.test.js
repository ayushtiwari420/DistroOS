import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import User from '../src/modules/users/user.model.js'
import Product from '../src/modules/products/product.model.js'
import Order from '../src/modules/orders/order.model.js'
import Credit from '../src/modules/credit/credit.model.js'

import * as analyticsService from '../src/modules/analytics/analytics.service.js'

describe('DistroOS Retailer 360 Insights Integration Test Suite', () => {
  let wholesalerA, wholesalerB
  let retailerNoOrders, retailerOneOrder, retailerMultiOrders, retailerOtherWholesaler
  let retailerWithCredit, retailerNoCredit
  let product1, product2
  let order1, order2, order3

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI)

    // Cleanup previous test data
    await User.deleteMany({ email: { $regex: '@r360test\\.com$' } })
    await Product.deleteMany({ name: { $regex: '^R360Test' } })

    wholesalerA = await User.create({
      name: 'R360 Wholesaler A',
      email: 'wA@r360test.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'W-A Corp',
    })

    wholesalerB = await User.create({
      name: 'R360 Wholesaler B',
      email: 'wB@r360test.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'W-B Corp',
    })

    // Retailer 1: No orders, No credit
    retailerNoOrders = await User.create({
      name: 'Retailer Zero',
      email: 'zero@r360test.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Zero Orders Mart',
      city: 'Mumbai',
    })

    // Retailer 2: One order, With credit
    retailerOneOrder = await User.create({
      name: 'Retailer One',
      email: 'one@r360test.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Single Order Store',
      city: 'Delhi',
    })

    // Retailer 3: Multiple orders, With credit
    retailerMultiOrders = await User.create({
      name: 'Retailer Multi',
      email: 'multi@r360test.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Multi Order Hypermarket',
      city: 'Bangalore',
    })

    // Retailer 4: Belongs to Wholesaler B (Tenant Isolation Test)
    retailerOtherWholesaler = await User.create({
      name: 'Retailer Other',
      email: 'other@r360test.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerB._id,
      businessName: 'Other Tenant Store',
      city: 'Pune',
    })

    retailerWithCredit = retailerOneOrder
    retailerNoCredit = retailerNoOrders

    // Products
    product1 = await Product.create({
      wholesaler: wholesalerA._id,
      name: 'R360Test Product 1',
      price: 150,
      costPrice: 100,
      stock: 50,
      category: 'FMCG',
    })

    product2 = await Product.create({
      wholesaler: wholesalerA._id,
      name: 'R360Test Product 2',
      price: 300,
      costPrice: 200,
      stock: 30,
      category: 'Beverages',
    })

    // Credit Record for retailerOneOrder & retailerMultiOrders
    await Credit.create({
      wholesaler: wholesalerA._id,
      retailer: retailerOneOrder._id,
      creditLimit: 10000,
      currentDue: 1500,
      status: 'clear',
      lastPaymentDate: new Date(),
      transactions: [
        { type: 'credit', amount: 500, runningBalance: 1500, note: 'Partial payment', date: new Date() },
      ],
    })

    await Credit.create({
      wholesaler: wholesalerA._id,
      retailer: retailerMultiOrders._id,
      creditLimit: 25000,
      currentDue: 5000,
      status: 'clear',
      lastPaymentDate: new Date(),
      transactions: [
        { type: 'debit', amount: 5000, runningBalance: 5000, note: 'Invoice debit', date: new Date() },
      ],
    })

    // Order for retailerOneOrder
    order1 = await Order.create({
      wholesaler: wholesalerA._id,
      retailer: retailerOneOrder._id,
      items: [{ product: product1._id, productName: product1.name, quantity: 10, unitPrice: 150, totalPrice: 1500 }],
      totalAmount: 1500,
      amountPaid: 0,
      paymentType: 'credit',
      status: 'delivered',
    })

    // Orders for retailerMultiOrders
    order2 = await Order.create({
      wholesaler: wholesalerA._id,
      retailer: retailerMultiOrders._id,
      items: [{ product: product1._id, productName: product1.name, quantity: 20, unitPrice: 150, totalPrice: 3000 }],
      totalAmount: 3000,
      amountPaid: 3000,
      paymentType: 'cash',
      status: 'delivered',
    })

    order3 = await Order.create({
      wholesaler: wholesalerA._id,
      retailer: retailerMultiOrders._id,
      items: [
        { product: product1._id, productName: product1.name, quantity: 10, unitPrice: 150, totalPrice: 1500 },
        { product: product2._id, productName: product2.name, quantity: 5, unitPrice: 300, totalPrice: 1500 },
      ],
      totalAmount: 3000,
      amountPaid: 1000,
      paymentType: 'credit',
      status: 'delivered',
    })
  })

  after(async () => {
    if (wholesalerA) {
      await User.deleteMany({ email: { $regex: '@r360test\\.com$' } })
      await Product.deleteMany({ name: { $regex: '^R360Test' } })
      await Order.deleteMany({ wholesaler: { $in: [wholesalerA._id, wholesalerB._id] } })
      await Credit.deleteMany({ wholesaler: { $in: [wholesalerA._id, wholesalerB._id] } })
    }
    await mongoose.disconnect()
  })

  // ── TEST 1: RETAILER WITH NO ORDERS ──
  it('handles retailer with no orders correctly without errors', async () => {
    const res = await analyticsService.getRetailerInsights(wholesalerA._id.toString(), retailerNoOrders._id.toString())
    assert.ok(res.retailer)
    assert.strictEqual(res.retailer.name, 'Retailer Zero')
    assert.strictEqual(res.metrics.totalSpent, 0)
    assert.strictEqual(res.metrics.totalOrders, 0)
    assert.strictEqual(res.metrics.deliveredCount, 0)
    assert.strictEqual(res.metrics.averageOrderValue, 0)
    assert.strictEqual(res.topProducts.length, 0)
    assert.strictEqual(res.recentOrders.length, 0)
    assert.ok(res.activityTimeline.length >= 1) // Account created event exists
  })

  // ── TEST 2: RETAILER WITH ONE ORDER ──
  it('calculates metrics accurately for retailer with one delivered order', async () => {
    const res = await analyticsService.getRetailerInsights(wholesalerA._id.toString(), retailerOneOrder._id.toString())
    assert.ok(res.retailer)
    assert.strictEqual(res.metrics.totalSpent, 1500)
    assert.strictEqual(res.metrics.totalOrders, 1)
    assert.strictEqual(res.metrics.deliveredCount, 1)
    assert.strictEqual(res.metrics.averageOrderValue, 1500)
    assert.strictEqual(res.topProducts.length, 1)
    assert.strictEqual(res.topProducts[0].productName, 'R360Test Product 1')
    assert.strictEqual(res.recentOrders.length, 1)
  })

  // ── TEST 3: RETAILER WITH MULTIPLE ORDERS ──
  it('aggregates metrics, top products, and order history for retailer with multiple orders', async () => {
    const res = await analyticsService.getRetailerInsights(wholesalerA._id.toString(), retailerMultiOrders._id.toString())
    assert.ok(res.retailer)
    assert.strictEqual(res.metrics.totalSpent, 6000) // 3000 + 3000
    assert.strictEqual(res.metrics.totalOrders, 2)
    assert.strictEqual(res.metrics.deliveredCount, 2)
    assert.strictEqual(res.metrics.averageOrderValue, 3000)
    assert.strictEqual(res.recentOrders.length, 2)
    assert.strictEqual(res.purchaseBehavior.paymentTypeDistribution.cash, 1)
    assert.strictEqual(res.purchaseBehavior.paymentTypeDistribution.credit, 1)
  })

  // ── TEST 4: RETAILER FROM ANOTHER WHOLESALER (TENANT SAFETY) ──
  it('rejects access when Wholesaler A attempts to query Wholesaler B retailer', async () => {
    await assert.rejects(
      async () => {
        await analyticsService.getRetailerInsights(wholesalerA._id.toString(), retailerOtherWholesaler._id.toString())
      },
      (err) => err.statusCode === 404 || err.message.includes('not found')
    )
  })

  // ── TEST 5: RETAILER WITH CREDIT ──
  it('returns complete credit profile and transaction history for retailer with credit', async () => {
    const res = await analyticsService.getRetailerInsights(wholesalerA._id.toString(), retailerWithCredit._id.toString())
    assert.ok(res.creditOverview)
    assert.strictEqual(res.creditOverview.hasCredit, true)
    assert.strictEqual(res.creditOverview.creditLimit, 10000)
    assert.strictEqual(res.creditOverview.currentDue, 1500)
    assert.strictEqual(res.creditOverview.availableCredit, 8500)
    assert.strictEqual(res.paymentHistory.recentTransactions.length, 1)
  })

  // ── TEST 6: RETAILER WITHOUT CREDIT ──
  it('returns clean zeroed credit profile for retailer without credit initialized', async () => {
    const res = await analyticsService.getRetailerInsights(wholesalerA._id.toString(), retailerNoCredit._id.toString())
    assert.ok(res.creditOverview)
    assert.strictEqual(res.creditOverview.hasCredit, false)
    assert.strictEqual(res.creditOverview.creditLimit, 0)
    assert.strictEqual(res.creditOverview.currentDue, 0)
    assert.strictEqual(res.creditOverview.availableCredit, 0)
    assert.strictEqual(res.paymentHistory.recentTransactions.length, 0)
  })
})
