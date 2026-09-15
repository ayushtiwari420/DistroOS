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

describe('Inventory Intelligence V1 Integration Test Suite', () => {
  let wholesalerA, wholesalerB
  let retailerA, retailerB
  let pLowStock, pFastMoving, pSlowMoving, pNoSales, pOutOfStock, pSafe, pWholesalerB
  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI)

    // Cleanup previous test data
    await User.deleteMany({ email: { $regex: '@invinteltest\\.com$' } })
    await Product.deleteMany({ name: { $regex: '^InvIntelTest' } })

    wholesalerA = await User.create({
      name: 'InvIntel Wholesaler A',
      email: 'wA@invinteltest.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'InvIntel Corp A',
    })

    wholesalerB = await User.create({
      name: 'InvIntel Wholesaler B',
      email: 'wB@invinteltest.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'InvIntel Corp B',
    })

    retailerA = await User.create({
      name: 'InvIntel Retailer A',
      email: 'rA@invinteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Retailer A Store',
    })

    retailerB = await User.create({
      name: 'InvIntel Retailer B',
      email: 'rB@invinteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerB._id,
      businessName: 'Retailer B Store',
    })

    // 1. Low stock product: stock = 5, lowStockAt = 10
    pLowStock = await Product.create({
      name: 'InvIntelTest Low Stock Chips',
      sku: 'INV-LOW-01',
      category: 'Snacks',
      price: 40,
      costPrice: 25,
      stock: 5,
      lowStockAt: 10,
      unit: 'pack',
      wholesaler: wholesalerA._id,
      isActive: true,
    })

    // 2. Fast-moving product: 150 units sold in last 30 days -> velocity = 5.0/day
    pFastMoving = await Product.create({
      name: 'InvIntelTest Fast Energy Drink',
      sku: 'INV-FST-02',
      category: 'Beverages',
      price: 100,
      costPrice: 60,
      stock: 500,
      lowStockAt: 20,
      unit: 'can',
      wholesaler: wholesalerA._id,
      isActive: true,
    })

    // 3. Slow-moving product: 3 units sold in last 30 days -> velocity = 0.1/day
    pSlowMoving = await Product.create({
      name: 'InvIntelTest Slow Specialty Sauce',
      sku: 'INV-SLW-03',
      category: 'Condiments',
      price: 200,
      costPrice: 120,
      stock: 50,
      lowStockAt: 5,
      unit: 'bottle',
      wholesaler: wholesalerA._id,
      isActive: true,
    })

    // 4. Product with no recent sales: 0 sales in 30 days, stock = 100
    pNoSales = await Product.create({
      name: 'InvIntelTest Unsold Cereal Box',
      sku: 'INV-NOS-04',
      category: 'Breakfast',
      price: 150,
      costPrice: 90,
      stock: 100,
      lowStockAt: 10,
      unit: 'box',
      wholesaler: wholesalerA._id,
      isActive: true,
    })

    // 5. Out of stock product: stock = 0, lowStockAt = 15
    pOutOfStock = await Product.create({
      name: 'InvIntelTest Zero Stock Noodles',
      sku: 'INV-ZRO-05',
      category: 'Snacks',
      price: 30,
      costPrice: 18,
      stock: 0,
      lowStockAt: 15,
      unit: 'pack',
      wholesaler: wholesalerA._id,
      isActive: true,
    })

    // 6. Safe inventory product: stock = 300, 30 units sold in last 30 days -> velocity = 1.0/day -> est 300 days
    pSafe = await Product.create({
      name: 'InvIntelTest Safe Stock Soap Bar',
      sku: 'INV-SAF-06',
      category: 'Personal Care',
      price: 50,
      costPrice: 30,
      stock: 300,
      lowStockAt: 10,
      unit: 'bar',
      wholesaler: wholesalerA._id,
      isActive: true,
    })

    // Wholesaler B product
    pWholesalerB = await Product.create({
      name: 'InvIntelTest Wholesaler B Item',
      sku: 'INV-WSB-07',
      category: 'General',
      price: 500,
      costPrice: 300,
      stock: 100,
      lowStockAt: 10,
      unit: 'unit',
      wholesaler: wholesalerB._id,
      isActive: true,
    })

    // Orders for pFastMoving (150 units delivered)
    await Order.create({
      orderNumber: 'ORD-INV-001',
      wholesaler: wholesalerA._id,
      retailer: retailerA._id,
      items: [
        {
          product: pFastMoving._id,
          productName: pFastMoving.name,
          quantity: 150,
          unitPrice: pFastMoving.price,
          totalPrice: 15000,
        },
      ],
      totalAmount: 15000,
      status: 'delivered',
      createdAt: new Date(now - 10 * DAY_MS),
    })

    // Orders for pSlowMoving (3 units delivered)
    await Order.create({
      orderNumber: 'ORD-INV-002',
      wholesaler: wholesalerA._id,
      retailer: retailerA._id,
      items: [
        {
          product: pSlowMoving._id,
          productName: pSlowMoving.name,
          quantity: 3,
          unitPrice: pSlowMoving.price,
          totalPrice: 600,
        },
      ],
      totalAmount: 600,
      status: 'delivered',
      createdAt: new Date(now - 15 * DAY_MS),
    })

    // Orders for pSafe (30 units delivered)
    await Order.create({
      orderNumber: 'ORD-INV-003',
      wholesaler: wholesalerA._id,
      retailer: retailerA._id,
      items: [
        {
          product: pSafe._id,
          productName: pSafe.name,
          quantity: 30,
          unitPrice: pSafe.price,
          totalPrice: 1500,
        },
      ],
      totalAmount: 1500,
      status: 'delivered',
      createdAt: new Date(now - 20 * DAY_MS),
    })

    // Cancelled order for pLowStock (100 units cancelled -> should NOT count toward demand)
    await Order.create({
      orderNumber: 'ORD-INV-004',
      wholesaler: wholesalerA._id,
      retailer: retailerA._id,
      items: [
        {
          product: pLowStock._id,
          productName: pLowStock.name,
          quantity: 100,
          unitPrice: pLowStock.price,
          totalPrice: 4000,
        },
      ],
      totalAmount: 4000,
      status: 'cancelled',
      createdAt: new Date(now - 5 * DAY_MS),
    })

    // Order for Wholesaler B
    await Order.create({
      orderNumber: 'ORD-INV-005',
      wholesaler: wholesalerB._id,
      retailer: retailerB._id,
      items: [
        {
          product: pWholesalerB._id,
          productName: pWholesalerB.name,
          quantity: 50,
          unitPrice: pWholesalerB.price,
          totalPrice: 25000,
        },
      ],
      totalAmount: 25000,
      status: 'delivered',
      createdAt: new Date(now - 8 * DAY_MS),
    })
  })

  after(async () => {
    await User.deleteMany({ email: { $regex: '@invinteltest\\.com$' } })
    await Product.deleteMany({ name: { $regex: '^InvIntelTest' } })
    await Order.deleteMany({ orderNumber: { $regex: '^ORD-INV-' } })
    await mongoose.disconnect()
  })

  it('Scenario 1: Detects low stock products accurately', async () => {
    const res = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      status: 'LOW_STOCK',
    })
    const lowStockIds = res.products.map((p) => p.product.id.toString())
    assert.ok(lowStockIds.includes(pLowStock._id.toString()))
    assert.ok(lowStockIds.includes(pOutOfStock._id.toString()))
    const item = res.products.find((p) => p.product.id.toString() === pLowStock._id.toString())
    assert.strictEqual(item.isLowStock, true)
    assert.strictEqual(item.shortageAmount, 5)
  })

  it('Scenario 2: Correctly identifies normal stock product with safe stock levels', async () => {
    const res = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      search: pSafe.name,
    })
    assert.strictEqual(res.products.length, 1)
    const item = res.products[0]
    assert.strictEqual(item.isLowStock, false)
    assert.strictEqual(item.stockoutRiskStatus, 'SAFE')
  })

  it('Scenario 3: Classifies fast-moving products with velocity >= 3.0 units/day', async () => {
    const res = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      search: pFastMoving.name,
    })
    assert.strictEqual(res.products.length, 1)
    const item = res.products[0]
    assert.strictEqual(item.movementStatus, 'FAST_MOVING')
    assert.strictEqual(item.dailySalesVelocity, 5.0)
  })

  it('Scenario 4: Classifies slow-moving products with low non-zero sales velocity', async () => {
    const res = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      search: pSlowMoving.name,
    })
    assert.strictEqual(res.products.length, 1)
    const item = res.products[0]
    assert.strictEqual(item.movementStatus, 'SLOW_MOVING')
    assert.strictEqual(item.dailySalesVelocity, 0.1)
  })

  it('Scenario 5: Classifies products with zero sales in last 30 days as NO_RECENT_SALES', async () => {
    const res = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      search: pNoSales.name,
    })
    assert.strictEqual(res.products.length, 1)
    const item = res.products[0]
    assert.strictEqual(item.movementStatus, 'NO_RECENT_SALES')
    assert.strictEqual(item.unitsSold30Days, 0)
  })

  it('Scenario 6: Handles zero sales velocity & zero stock without NaN/Infinity', async () => {
    const res = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      search: pOutOfStock.name,
    })
    assert.strictEqual(res.products.length, 1)
    const item = res.products[0]
    assert.strictEqual(item.stock, 0)
    assert.strictEqual(item.estimatedDaysOfStock, 0)
    assert.strictEqual(item.stockoutRiskStatus, 'STOCKOUT_RISK')
  })

  it('Scenario 7: Classifies stockout risk when stock <= lowStockAt or estimated days <= 7', async () => {
    const res = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      status: 'STOCKOUT_RISK',
    })
    assert.ok(res.products.length >= 2)
    const ids = res.products.map((p) => p.product.id.toString())
    assert.ok(ids.includes(pLowStock._id.toString()))
    assert.ok(ids.includes(pOutOfStock._id.toString()))
  })

  it('Scenario 8: Classifies safe inventory when stock is healthy and velocity is sustainable', async () => {
    const res = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      status: 'SAFE',
    })
    const ids = res.products.map((p) => p.product.id.toString())
    assert.ok(ids.includes(pSafe._id.toString()))
  })

  it('Scenario 9: Handles insufficient sales history gracefully as INSUFFICIENT_DATA', async () => {
    const res = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      search: pNoSales.name,
    })
    assert.strictEqual(res.products.length, 1)
    const item = res.products[0]
    assert.strictEqual(item.stockoutRiskStatus, 'INSUFFICIENT_DATA')
    assert.strictEqual(item.estimatedDaysOfStock, 999)
  })

  it('Scenario 10: Calculates inventory cost value and potential sales value accurately', async () => {
    const res = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      search: pFastMoving.name,
    })
    assert.strictEqual(res.products.length, 1)
    const item = res.products[0]
    // 500 stock * 60 costPrice = 30000
    assert.strictEqual(item.inventoryCostValue, 30000)
    // 500 stock * 100 price = 50000
    assert.strictEqual(item.potentialSalesValue, 50000)
  })

  it('Scenario 11: Excludes cancelled orders from demand velocity calculation', async () => {
    const res = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      search: pLowStock.name,
    })
    assert.strictEqual(res.products.length, 1)
    const item = res.products[0]
    assert.strictEqual(item.unitsSold30Days, 0, 'Cancelled order of 100 units must be excluded')
  })

  it('Scenario 12: Enforces 100% tenant isolation (Wholesaler A cannot see Wholesaler B products)', async () => {
    const resA = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString())
    const hasProductB = resA.products.some((p) => p.product.id.toString() === pWholesalerB._id.toString())
    assert.strictEqual(hasProductB, false, 'Wholesaler A must not see Wholesaler B inventory')
  })

  it('Scenario 13: Supports pagination parameters (page, limit, totalPages)', async () => {
    const page1 = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      page: 1,
      limit: 2,
    })
    assert.strictEqual(page1.products.length, 2)
    assert.strictEqual(page1.pagination.total, 6)
    assert.strictEqual(page1.pagination.totalPages, 3)
    assert.strictEqual(page1.pagination.hasNextPage, true)

    const page2 = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      page: 2,
      limit: 2,
    })
    assert.strictEqual(page2.products.length, 2)
    assert.notStrictEqual(page1.products[0].product.id, page2.products[0].product.id)
  })

  it('Scenario 14: Filters correctly by status, category, and search query', async () => {
    const resCategory = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      category: 'Beverages',
    })
    assert.strictEqual(resCategory.products.length, 1)
    assert.strictEqual(resCategory.products[0].product.id.toString(), pFastMoving._id.toString())

    const resStatus = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      status: 'FAST_MOVING',
    })
    assert.strictEqual(resStatus.products.length, 1)
    assert.strictEqual(resStatus.products[0].product.id.toString(), pFastMoving._id.toString())
  })

  it('Scenario 15: Sorts results by velocity, risk, value, and stock', async () => {
    const resVelocity = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      sortBy: 'velocity',
    })
    assert.strictEqual(resVelocity.products[0].product.id.toString(), pFastMoving._id.toString())

    const resValue = await analyticsService.getInventoryIntelligence(wholesalerA._id.toString(), {
      sortBy: 'value',
    })
    assert.strictEqual(resValue.products[0].product.id.toString(), pFastMoving._id.toString())
  })
})
