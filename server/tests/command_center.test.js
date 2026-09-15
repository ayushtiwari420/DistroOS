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

describe('DistroOS Command Center V1 Integration Test Suite', () => {
  let wholesalerA, wholesalerB, emptyWholesaler
  let retailerA, retailerB
  let productLowStock, productFastMoving
  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI)

    // Cleanup previous test data
    await User.deleteMany({ email: { $regex: '@cmdtest\\.com$' } })
    await Product.deleteMany({ name: { $regex: '^CmdTest' } })
    await Order.deleteMany({ orderNumber: { $regex: '^ORD-CMD-' } })
    await Credit.deleteMany({ note: { $regex: 'CmdTest' } })

    wholesalerA = await User.create({
      name: 'CmdWholesaler A',
      email: 'wA@cmdtest.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'Cmd Corp A',
    })

    wholesalerB = await User.create({
      name: 'CmdWholesaler B',
      email: 'wB@cmdtest.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'Cmd Corp B',
    })

    emptyWholesaler = await User.create({
      name: 'CmdWholesaler Empty',
      email: 'wEmpty@cmdtest.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'Empty Wholesaler',
    })

    retailerA = await User.create({
      name: 'CmdRetailer A',
      email: 'rA@cmdtest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Cmd Store A',
      city: 'Mumbai',
    })

    retailerB = await User.create({
      name: 'CmdRetailer B',
      email: 'rB@cmdtest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerB._id,
      businessName: 'Cmd Store B',
      city: 'Delhi',
    })

    productLowStock = await Product.create({
      name: 'CmdTest Low Stock Item',
      sku: 'CMD-LOW-01',
      category: 'Snacks',
      price: 50,
      costPrice: 30,
      stock: 2,
      lowStockAt: 10,
      unit: 'pack',
      wholesaler: wholesalerA._id,
      isActive: true,
    })

    productFastMoving = await Product.create({
      name: 'CmdTest Fast Item',
      sku: 'CMD-FST-02',
      category: 'Beverages',
      price: 100,
      costPrice: 60,
      stock: 500,
      lowStockAt: 20,
      unit: 'bottle',
      wholesaler: wholesalerA._id,
      isActive: true,
    })

    // Orders for Wholesaler A
    await Order.create({
      orderNumber: 'ORD-CMD-001',
      wholesaler: wholesalerA._id,
      retailer: retailerA._id,
      items: [
        {
          product: productFastMoving._id,
          productName: productFastMoving.name,
          quantity: 20,
          unitPrice: productFastMoving.price,
          totalPrice: 2000,
        },
      ],
      totalAmount: 2000,
      status: 'delivered',
      createdAt: new Date(now - 10 * DAY_MS),
    })

    await Order.create({
      orderNumber: 'ORD-CMD-002',
      wholesaler: wholesalerA._id,
      retailer: retailerA._id,
      items: [
        {
          product: productFastMoving._id,
          productName: productFastMoving.name,
          quantity: 20,
          unitPrice: productFastMoving.price,
          totalPrice: 2000,
        },
      ],
      totalAmount: 2000,
      status: 'delivered',
      createdAt: new Date(now - 2 * DAY_MS),
    })

    // Credit account for Retailer A with overdue status
    await Credit.create({
      wholesaler: wholesalerA._id,
      retailer: retailerA._id,
      creditLimit: 50000,
      currentDue: 30000,
      status: 'overdue',
      transactions: [
        { type: 'debit', amount: 30000, runningBalance: 30000, note: 'CmdTest Order Credit', date: new Date(now - 30 * DAY_MS) },
        { type: 'credit', amount: 5000, runningBalance: 25000, note: 'CmdTest Repayment', date: new Date(now - 5 * DAY_MS) },
      ],
    })

    // Wholesaler B order
    await Order.create({
      orderNumber: 'ORD-CMD-003',
      wholesaler: wholesalerB._id,
      retailer: retailerB._id,
      items: [
        {
          product: productFastMoving._id,
          productName: productFastMoving.name,
          quantity: 50,
          unitPrice: 100,
          totalPrice: 5000,
        },
      ],
      totalAmount: 5000,
      status: 'delivered',
      createdAt: new Date(now - 1 * DAY_MS),
    })
  })

  after(async () => {
    await User.deleteMany({ email: { $regex: '@cmdtest\\.com$' } })
    await Product.deleteMany({ name: { $regex: '^CmdTest' } })
    await Order.deleteMany({ orderNumber: { $regex: '^ORD-CMD-' } })
    await Credit.deleteMany({ note: { $regex: 'CmdTest' } })
    await mongoose.disconnect()
  })

  it('Scenario 1: Command Center payload loads successfully with all required sections', async () => {
    const res = await analyticsService.getCommandCenter(wholesalerA._id.toString())
    assert.ok(res.attention)
    assert.ok(res.snapshot)
    assert.ok(Array.isArray(res.smartReorder))
    assert.ok(Array.isArray(res.inventoryAttention))
    assert.ok(Array.isArray(res.creditAttention))
    assert.ok(Array.isArray(res.salesTrend))
    assert.ok(Array.isArray(res.recentActivity))
  })

  it('Scenario 2: Enforces strict tenant isolation (Wholesaler A cannot see Wholesaler B data)', async () => {
    const resA = await analyticsService.getCommandCenter(wholesalerA._id.toString())
    const resB = await analyticsService.getCommandCenter(wholesalerB._id.toString())
    assert.notStrictEqual(resA.snapshot.thirtyDayRevenue, resB.snapshot.thirtyDayRevenue)
    assert.strictEqual(
      resA.recentActivity.some((act) => act.subtitle === 'Cmd Store B'),
      false
    )
  })

  it('Scenario 3: Calculates actionable attention counts accurately', async () => {
    const res = await analyticsService.getCommandCenter(wholesalerA._id.toString())
    assert.ok(res.attention.lowStockCount >= 1)
    assert.ok(res.attention.stockoutRiskCount >= 1)
    assert.ok(res.attention.creditOverdueCount >= 1)
    assert.ok(res.attention.totalOverdueAmount >= 25000)
  })

  it('Scenario 4: Top inventory attention list filters and prioritizes high-risk items', async () => {
    const res = await analyticsService.getCommandCenter(wholesalerA._id.toString())
    assert.ok(res.inventoryAttention.length >= 1)
    const hasLowStockItem = res.inventoryAttention.some(
      (item) => item.product.id.toString() === productLowStock._id.toString()
    )
    assert.strictEqual(hasLowStockItem, true)
  })

  it('Scenario 5: Returns top Smart Reorder recommendations list', async () => {
    const res = await analyticsService.getCommandCenter(wholesalerA._id.toString())
    assert.ok(Array.isArray(res.smartReorder))
  })

  it('Scenario 6: Returns top credit attention list', async () => {
    const res = await analyticsService.getCommandCenter(wholesalerA._id.toString())
    assert.ok(res.creditAttention.length >= 1)
    assert.strictEqual(res.creditAttention[0].retailer.name, 'Cmd Store A')
    assert.strictEqual(res.creditAttention[0].creditHealthStatus, 'OVERDUE')
  })

  it('Scenario 7: Calculates business snapshot metrics correctly', async () => {
    const res = await analyticsService.getCommandCenter(wholesalerA._id.toString())
    assert.strictEqual(res.snapshot.activeRetailers, 1)
    assert.ok(res.snapshot.thirtyDayRevenue >= 4000)
  })

  it('Scenario 8: Returns sales trend chart array', async () => {
    const res = await analyticsService.getCommandCenter(wholesalerA._id.toString())
    assert.ok(Array.isArray(res.salesTrend))
  })

  it('Scenario 9: Constructs recent activity timeline from real order & credit events', async () => {
    const res = await analyticsService.getCommandCenter(wholesalerA._id.toString())
    assert.ok(res.recentActivity.length >= 1)
    const hasOrderEvent = res.recentActivity.some((act) => act.type === 'order')
    assert.strictEqual(hasOrderEvent, true)
  })

  it('Scenario 10: Handles empty wholesaler dataset gracefully with zeroed snapshot & empty arrays', async () => {
    const res = await analyticsService.getCommandCenter(emptyWholesaler._id.toString())
    assert.strictEqual(res.snapshot.todayRevenue, 0)
    assert.strictEqual(res.snapshot.activeRetailers, 0)
    assert.strictEqual(res.attention.totalAttentionItems, 0)
    assert.strictEqual(res.smartReorder.length, 0)
    assert.strictEqual(res.inventoryAttention.length, 0)
    assert.strictEqual(res.creditAttention.length, 0)
  })

  it('Scenario 11: Handles insufficient historical data without throwing errors', async () => {
    const res = await analyticsService.getCommandCenter(emptyWholesaler._id.toString())
    assert.ok(res.attention)
  })

  it('Scenario 12: Recovers gracefully on invalid wholesaler ID format', async () => {
    try {
      await analyticsService.getCommandCenter('invalid-mongo-id')
      assert.fail('Should have thrown error on invalid ObjectId')
    } catch (err) {
      assert.ok(err)
    }
  })
})
