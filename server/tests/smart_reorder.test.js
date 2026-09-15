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

import * as analyticsService from '../src/modules/analytics/analytics.service.js'

describe('Smart Reorder V1 Integration Test Suite', () => {
  let wholesalerA, wholesalerB
  let retailerNoOrders, retailerOneOrder, retailerConsistent, retailerIrregular, retailerOtherWholesaler
  let activeProduct1, activeProduct2, inactiveProduct
  let now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI)

    // Cleanup previous test data
    await User.deleteMany({ email: { $regex: '@smartreordertest\\.com$' } })
    await Product.deleteMany({ name: { $regex: '^SmartReorderTest' } })

    wholesalerA = await User.create({
      name: 'SmartReorder Wholesaler A',
      email: 'wholesalerA@smartreordertest.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'SR Wholesaler A Corp',
    })

    wholesalerB = await User.create({
      name: 'SmartReorder Wholesaler B',
      email: 'wholesalerB@smartreordertest.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'SR Wholesaler B Corp',
    })

    // Retailer 1: No orders
    retailerNoOrders = await User.create({
      name: 'Retailer Zero',
      email: 'zero@smartreordertest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Zero Orders Store',
      city: 'Mumbai',
    })

    // Retailer 2: 1 order
    retailerOneOrder = await User.create({
      name: 'Retailer Single',
      email: 'single@smartreordertest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Single Order Store',
      city: 'Delhi',
    })

    // Retailer 3: Consistent order intervals
    retailerConsistent = await User.create({
      name: 'Retailer Consistent',
      email: 'consistent@smartreordertest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Consistent Supermarket',
      city: 'Bangalore',
    })

    // Retailer 4: Irregular intervals
    retailerIrregular = await User.create({
      name: 'Retailer Irregular',
      email: 'irregular@smartreordertest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Irregular Mart',
      city: 'Pune',
    })

    // Retailer 5: Belongs to Wholesaler B
    retailerOtherWholesaler = await User.create({
      name: 'Retailer Other Wholesaler',
      email: 'other@smartreordertest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerB._id,
      businessName: 'Other Wholesaler Store',
      city: 'Kolkata',
    })

    // Products
    activeProduct1 = await Product.create({
      name: 'SmartReorderTest Biscuit Pack',
      sku: 'SR-BIS-01',
      category: 'Snacks',
      price: 50,
      costPrice: 35,
      stock: 500,
      unit: 'pack',
      wholesaler: wholesalerA._id,
      isActive: true,
    })

    activeProduct2 = await Product.create({
      name: 'SmartReorderTest Juice Box',
      sku: 'SR-JUC-02',
      category: 'Beverages',
      price: 100,
      costPrice: 70,
      stock: 200,
      unit: 'box',
      wholesaler: wholesalerA._id,
      isActive: true,
    })

    inactiveProduct = await Product.create({
      name: 'SmartReorderTest Discontinued Tea',
      sku: 'SR-TEA-03',
      category: 'Beverages',
      price: 80,
      costPrice: 50,
      stock: 0,
      unit: 'pack',
      wholesaler: wholesalerA._id,
      isActive: false,
    })

    // Create order for Retailer 2 (1 order)
    await Order.create({
      orderNumber: 'ORD-SR-001',
      wholesaler: wholesalerA._id,
      retailer: retailerOneOrder._id,
      items: [
        {
          product: activeProduct1._id,
          productName: activeProduct1.name,
          quantity: 20,
          unitPrice: activeProduct1.price,
          totalPrice: 1000,
        },
      ],
      totalAmount: 1000,
      status: 'delivered',
      createdAt: new Date(now - 10 * DAY_MS),
    })

    // Create 3 orders for Retailer 3 with activeProduct1 (Consistent 10-day interval: 30 days ago, 20 days ago, 10 days ago -> interval 10 days, last purchase 10 days ago -> REORDER_DUE)
    await Order.create({
      orderNumber: 'ORD-SR-002',
      wholesaler: wholesalerA._id,
      retailer: retailerConsistent._id,
      items: [
        {
          product: activeProduct1._id,
          productName: activeProduct1.name,
          quantity: 50,
          unitPrice: activeProduct1.price,
          totalPrice: 2500,
        },
      ],
      totalAmount: 2500,
      status: 'delivered',
      createdAt: new Date(now - 30 * DAY_MS),
    })

    await Order.create({
      orderNumber: 'ORD-SR-003',
      wholesaler: wholesalerA._id,
      retailer: retailerConsistent._id,
      items: [
        {
          product: activeProduct1._id,
          productName: activeProduct1.name,
          quantity: 50,
          unitPrice: activeProduct1.price,
          totalPrice: 2500,
        },
      ],
      totalAmount: 2500,
      status: 'delivered',
      createdAt: new Date(now - 20 * DAY_MS),
    })

    await Order.create({
      orderNumber: 'ORD-SR-004',
      wholesaler: wholesalerA._id,
      retailer: retailerConsistent._id,
      items: [
        {
          product: activeProduct1._id,
          productName: activeProduct1.name,
          quantity: 50,
          unitPrice: activeProduct1.price,
          totalPrice: 2500,
        },
      ],
      totalAmount: 2500,
      status: 'delivered',
      createdAt: new Date(now - 10 * DAY_MS),
    })

    // Retailer 3 also bought activeProduct2 (Interval: 20 days ago, 12 days ago -> interval 8 days, last purchase 2 days ago -> NOT_DUE since 2 < 6)
    await Order.create({
      orderNumber: 'ORD-SR-005',
      wholesaler: wholesalerA._id,
      retailer: retailerConsistent._id,
      items: [
        {
          product: activeProduct2._id,
          productName: activeProduct2.name,
          quantity: 10,
          unitPrice: activeProduct2.price,
          totalPrice: 1000,
        },
      ],
      totalAmount: 1000,
      status: 'delivered',
      createdAt: new Date(now - 20 * DAY_MS),
    })

    await Order.create({
      orderNumber: 'ORD-SR-006',
      wholesaler: wholesalerA._id,
      retailer: retailerConsistent._id,
      items: [
        {
          product: activeProduct2._id,
          productName: activeProduct2.name,
          quantity: 10,
          unitPrice: activeProduct2.price,
          totalPrice: 1000,
        },
      ],
      totalAmount: 1000,
      status: 'delivered',
      createdAt: new Date(now - 2 * DAY_MS),
    })

    // Retailer 4 (Irregular): 2 orders for activeProduct1 (20 days ago, 5 days ago -> interval 15 days; 75% of 15 is 11 days; last purchase 12 days ago -> DUE_SOON since 11 <= 12 < 15)
    await Order.create({
      orderNumber: 'ORD-SR-007',
      wholesaler: wholesalerA._id,
      retailer: retailerIrregular._id,
      items: [
        {
          product: activeProduct1._id,
          productName: activeProduct1.name,
          quantity: 30,
          unitPrice: activeProduct1.price,
          totalPrice: 1500,
        },
      ],
      totalAmount: 1500,
      status: 'delivered',
      createdAt: new Date(now - 27 * DAY_MS),
    })

    await Order.create({
      orderNumber: 'ORD-SR-008',
      wholesaler: wholesalerA._id,
      retailer: retailerIrregular._id,
      items: [
        {
          product: activeProduct1._id,
          productName: activeProduct1.name,
          quantity: 30,
          unitPrice: activeProduct1.price,
          totalPrice: 1500,
        },
      ],
      totalAmount: 1500,
      status: 'delivered',
      createdAt: new Date(now - 12 * DAY_MS),
    })

    // Orders with inactive product (Retailer 3 bought inactiveProduct twice)
    await Order.create({
      orderNumber: 'ORD-SR-009',
      wholesaler: wholesalerA._id,
      retailer: retailerConsistent._id,
      items: [
        {
          product: inactiveProduct._id,
          productName: inactiveProduct.name,
          quantity: 15,
          unitPrice: inactiveProduct.price,
          totalPrice: 1200,
        },
      ],
      totalAmount: 1200,
      status: 'delivered',
      createdAt: new Date(now - 25 * DAY_MS),
    })

    await Order.create({
      orderNumber: 'ORD-SR-010',
      wholesaler: wholesalerA._id,
      retailer: retailerConsistent._id,
      items: [
        {
          product: inactiveProduct._id,
          productName: inactiveProduct.name,
          quantity: 15,
          unitPrice: inactiveProduct.price,
          totalPrice: 1200,
        },
      ],
      totalAmount: 1200,
      status: 'delivered',
      createdAt: new Date(now - 10 * DAY_MS),
    })

    // Cancelled order (Retailer 3 cancelled order for activeProduct1 on day -5)
    await Order.create({
      orderNumber: 'ORD-SR-011',
      wholesaler: wholesalerA._id,
      retailer: retailerConsistent._id,
      items: [
        {
          product: activeProduct1._id,
          productName: activeProduct1.name,
          quantity: 100,
          unitPrice: activeProduct1.price,
          totalPrice: 5000,
        },
      ],
      totalAmount: 5000,
      status: 'cancelled',
      createdAt: new Date(now - 5 * DAY_MS),
    })

    // Wholesaler B order
    await Order.create({
      orderNumber: 'ORD-SR-012',
      wholesaler: wholesalerB._id,
      retailer: retailerOtherWholesaler._id,
      items: [
        {
          product: activeProduct1._id,
          productName: activeProduct1.name,
          quantity: 40,
          unitPrice: activeProduct1.price,
          totalPrice: 2000,
        },
      ],
      totalAmount: 2000,
      status: 'delivered',
      createdAt: new Date(now - 15 * DAY_MS),
    })
  })

  after(async () => {
    await User.deleteMany({ email: { $regex: '@smartreordertest\\.com$' } })
    await Product.deleteMany({ name: { $regex: '^SmartReorderTest' } })
    const testOrderNumbers = [
      'ORD-SR-001', 'ORD-SR-002', 'ORD-SR-003', 'ORD-SR-004',
      'ORD-SR-005', 'ORD-SR-006', 'ORD-SR-007', 'ORD-SR-008',
      'ORD-SR-009', 'ORD-SR-010', 'ORD-SR-011', 'ORD-SR-012'
    ]
    await Order.deleteMany({ orderNumber: { $in: testOrderNumbers } })
    await mongoose.disconnect()
  })

  it('Scenario 1: Retailer with no order history returns INSUFFICIENT_DATA when queried directly', async () => {
    const result = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      retailer: retailerNoOrders._id.toString(),
    })
    assert.strictEqual(result.recommendations.length, 0, 'Retailer with zero orders should have no recommendation records')
  })

  it('Scenario 2: Retailer with only 1 order has status INSUFFICIENT_DATA', async () => {
    const result = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      retailer: retailerOneOrder._id.toString(),
    })
    assert.strictEqual(result.recommendations.length, 1)
    const rec = result.recommendations[0]
    assert.strictEqual(rec.status, 'INSUFFICIENT_DATA')
    assert.strictEqual(rec.totalOrdersCount, 1)
    assert.strictEqual(rec.averageOrderInterval, 0)
    assert.ok(rec.explanation.includes('at least 2 orders are required') || rec.explanation.includes('only once'))
  })

  it('Scenario 3: Retailer with 2+ orders calculates consistent interval accurately', async () => {
    const result = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      retailer: retailerConsistent._id.toString(),
      product: activeProduct1._id.toString(),
    })
    assert.strictEqual(result.recommendations.length, 1)
    const rec = result.recommendations[0]
    assert.strictEqual(rec.totalOrdersCount, 3)
    assert.strictEqual(rec.averageOrderInterval, 10, 'Expected average interval of 10 days between 30, 20, 10 days ago')
  })

  it('Scenario 4: Handles irregular order intervals by calculating mean interval', async () => {
    const result = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      retailer: retailerIrregular._id.toString(),
      product: activeProduct1._id.toString(),
    })
    assert.strictEqual(result.recommendations.length, 1)
    const rec = result.recommendations[0]
    assert.strictEqual(rec.averageOrderInterval, 15)
  })

  it('Scenario 5: Classifies status as REORDER_DUE when daysSinceLastPurchase >= averageOrderInterval', async () => {
    const result = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      retailer: retailerConsistent._id.toString(),
      product: activeProduct1._id.toString(),
    })
    assert.strictEqual(result.recommendations[0].status, 'REORDER_DUE')
  })

  it('Scenario 6: Classifies status as NOT_DUE when last purchase was recent', async () => {
    const result = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      retailer: retailerConsistent._id.toString(),
      product: activeProduct2._id.toString(),
    })
    assert.strictEqual(result.recommendations.length, 1)
    assert.strictEqual(result.recommendations[0].status, 'NOT_DUE')
  })

  it('Scenario 7: Classifies status as DUE_SOON when within 75% of interval window', async () => {
    const result = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      retailer: retailerIrregular._id.toString(),
      product: activeProduct1._id.toString(),
    })
    assert.strictEqual(result.recommendations.length, 1)
    assert.strictEqual(result.recommendations[0].status, 'DUE_SOON')
  })

  it('Scenario 8: Excludes cancelled orders from demand calculation', async () => {
    const result = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      retailer: retailerConsistent._id.toString(),
      product: activeProduct1._id.toString(),
    })
    // 3 delivered orders of 50 each; cancelled order of 100 should be excluded
    assert.strictEqual(result.recommendations[0].totalOrdersCount, 3)
    assert.strictEqual(result.recommendations[0].totalQuantityPurchased, 150)
  })

  it('Scenario 9: Enforces 100% tenant isolation (Wholesaler A cannot see Wholesaler B data)', async () => {
    const resultA = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString())
    const hasOtherRetailer = resultA.recommendations.some(
      (r) => r.retailer.id.toString() === retailerOtherWholesaler._id.toString()
    )
    assert.strictEqual(hasOtherRetailer, false, 'Wholesaler A should not see Wholesaler B retailer recommendations')
  })

  it('Scenario 10: Excludes inactive products from reorder recommendations', async () => {
    const result = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString())
    const hasInactive = result.recommendations.some(
      (r) => r.product.id.toString() === inactiveProduct._id.toString()
    )
    assert.strictEqual(hasInactive, false, 'Inactive products must be excluded')
  })

  it('Scenario 11: Supports pagination parameters (page, limit)', async () => {
    const page1 = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      page: 1,
      limit: 1,
    })
    assert.strictEqual(page1.recommendations.length, 1)
    assert.strictEqual(page1.pagination.total > 1, true)
    assert.strictEqual(page1.pagination.hasNextPage, true)

    const page2 = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      page: 2,
      limit: 1,
    })
    assert.strictEqual(page2.recommendations.length, 1)
    assert.notStrictEqual(page1.recommendations[0].product.id, page2.recommendations[0].product.id)
  })

  it('Scenario 12: Filters correctly by recommendation status', async () => {
    const resultDue = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      status: 'REORDER_DUE',
    })
    assert.ok(resultDue.recommendations.length > 0)
    resultDue.recommendations.forEach((rec) => {
      assert.strictEqual(rec.status, 'REORDER_DUE')
    })
  })

  it('Scenario 13: Calculates suggested quantity based on historical average quantity', async () => {
    const result = await analyticsService.getSmartReorderRecommendations(wholesalerA._id.toString(), {
      retailer: retailerConsistent._id.toString(),
      product: activeProduct1._id.toString(),
    })
    // 3 orders of 50 each -> average 50
    assert.strictEqual(result.recommendations[0].averageQuantity, 50)
    assert.strictEqual(result.recommendations[0].suggestedQuantity, 50)
  })
})
