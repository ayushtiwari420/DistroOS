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

describe('DistroOS Intelligence Foundation (Phase 1) Integration Suite', () => {
  let wholesalerA, wholesalerB
  let retailerA1, retailerA2, retailerB1
  let salesmanA
  let productA1, productA2, productB1
  let orderA1, orderA2, orderB1

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI)

    // Cleanup existing test data with intelligence prefix
    await User.deleteMany({ email: { $regex: '@inteltest\\.com$' } })
    await Product.deleteMany({ name: { $regex: '^IntelTest' } })

    // Create Wholesalers
    wholesalerA = await User.create({
      name: 'Intel Wholesaler A',
      email: 'wA@inteltest.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'W-A Distro',
    })
    wholesalerB = await User.create({
      name: 'Intel Wholesaler B',
      email: 'wB@inteltest.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'W-B Distro',
    })

    // Create Retailers
    retailerA1 = await User.create({
      name: 'Retailer A1',
      email: 'rA1@inteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'A1 Mart',
      city: 'Mumbai',
    })
    retailerA2 = await User.create({
      name: 'Retailer A2',
      email: 'rA2@inteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'A2 Store',
      city: 'Delhi',
    })
    retailerB1 = await User.create({
      name: 'Retailer B1',
      email: 'rB1@inteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerB._id,
      businessName: 'B1 Supermarket',
      city: 'Pune',
    })

    // Create Salesman
    salesmanA = await User.create({
      name: 'Sales Rep A',
      email: 'sA@inteltest.com',
      password: 'Password123',
      role: 'salesman',
      status: 'active',
      wholesaler: wholesalerA._id,
    })

    // Create Products
    productA1 = await Product.create({
      wholesaler: wholesalerA._id,
      name: 'IntelTest Product A1',
      category: 'Beverages',
      price: 100,
      costPrice: 70,
      stock: 50,
      lowStockAt: 15,
      isActive: true,
    })
    productA2 = await Product.create({
      wholesaler: wholesalerA._id,
      name: 'IntelTest Product A2',
      category: 'Snacks',
      price: 50,
      costPrice: 40,
      stock: 5,
      lowStockAt: 10,
      isActive: true,
    })
    productB1 = await Product.create({
      wholesaler: wholesalerB._id,
      name: 'IntelTest Product B1',
      category: 'Beverages',
      price: 200,
      costPrice: 150,
      stock: 100,
      lowStockAt: 20,
      isActive: true,
    })

    // Create Credit Records
    await Credit.create({
      wholesaler: wholesalerA._id,
      retailer: retailerA1._id,
      creditLimit: 10000,
      currentDue: 2000,
      status: 'clear',
      lastPaymentDate: new Date(),
    })
    await Credit.create({
      wholesaler: wholesalerA._id,
      retailer: retailerA2._id,
      creditLimit: 5000,
      currentDue: 4900,
      status: 'overdue',
    })

    // Create Delivered Orders
    orderA1 = await Order.create({
      wholesaler: wholesalerA._id,
      retailer: retailerA1._id,
      salesman: salesmanA._id,
      items: [
        { product: productA1._id, productName: productA1.name, quantity: 10, unitPrice: 100, totalPrice: 1000 },
        { product: productA2._id, productName: productA2.name, quantity: 5, unitPrice: 50, totalPrice: 250 },
      ],
      totalAmount: 1250,
      paymentType: 'cash',
      status: 'delivered',
    })

    orderA2 = await Order.create({
      wholesaler: wholesalerA._id,
      retailer: retailerA1._id,
      salesman: salesmanA._id,
      items: [
        { product: productA1._id, productName: productA1.name, quantity: 20, unitPrice: 100, totalPrice: 2000 },
      ],
      totalAmount: 2000,
      paymentType: 'credit',
      status: 'delivered',
    })

    orderB1 = await Order.create({
      wholesaler: wholesalerB._id,
      retailer: retailerB1._id,
      items: [
        { product: productB1._id, productName: productB1.name, quantity: 5, unitPrice: 200, totalPrice: 1000 },
      ],
      totalAmount: 1000,
      paymentType: 'cash',
      status: 'delivered',
    })
  })

  after(async () => {
    if (wholesalerA) {
      await User.deleteMany({ email: { $regex: '@inteltest\\.com$' } })
      await Product.deleteMany({ name: { $regex: '^IntelTest' } })
      await Order.deleteMany({ wholesaler: { $in: [wholesalerA._id, wholesalerB._id] } })
      await Credit.deleteMany({ wholesaler: { $in: [wholesalerA._id, wholesalerB._id] } })
    }
    await mongoose.disconnect()
  })

  // ── 1. EXECUTIVE DASHBOARD ANALYTICS ──
  describe('Executive Dashboard Analytics', () => {
    it('calculates total revenue, orders, active retailers, and low stock KPIs for Wholesaler A', async () => {
      const dashboard = await analyticsService.getExecutiveDashboardAnalytics(wholesalerA._id.toString())
      assert.ok(dashboard.kpis)
      assert.strictEqual(dashboard.kpis.totalRevenue, 3250) // 1250 + 2000
      assert.strictEqual(dashboard.kpis.totalOrders, 2)
      assert.strictEqual(dashboard.kpis.activeRetailers, 2)
      assert.strictEqual(dashboard.kpis.lowStockAlerts, 1) // Product A2 has stock 5 <= lowStockAt 10
    })

    it('returns top products and salesman performance correctly', async () => {
      const dashboard = await analyticsService.getExecutiveDashboardAnalytics(wholesalerA._id.toString())
      assert.ok(dashboard.topProducts)
      assert.strictEqual(dashboard.topProducts[0].productName, 'IntelTest Product A1')
      assert.strictEqual(dashboard.topProducts[0].totalRevenue, 3000)

      assert.ok(dashboard.salesRepPerformance)
      assert.strictEqual(dashboard.salesRepPerformance.length, 1)
      assert.strictEqual(dashboard.salesRepPerformance[0].name, 'Sales Rep A')
      assert.strictEqual(dashboard.salesRepPerformance[0].totalRevenue, 3250)
    })
  })

  // ── 2. PRODUCT INTELLIGENCE ANALYTICS ──
  describe('Product Intelligence & Sales Velocity', () => {
    it('calculates 30-day velocity, profit margin, and inventory days remaining', async () => {
      const res = await analyticsService.getProductAnalytics(wholesalerA._id.toString(), { sortBy: 'revenue' })
      assert.ok(res.products)
      assert.strictEqual(res.products.length, 2)

      const prodA1 = res.products.find((p) => p.productName === 'IntelTest Product A1')
      assert.ok(prodA1)
      assert.strictEqual(prodA1.unitsSold30Days, 30) // 10 + 20
      assert.strictEqual(prodA1.dailySalesVelocity, 1.0) // 30 / 30
      assert.strictEqual(prodA1.totalRevenue, 3000)
      assert.strictEqual(prodA1.profitMarginPercent, 30.0) // ((100 - 70) / 100) * 100
      assert.strictEqual(prodA1.daysOfInventoryRemaining, 50) // 50 stock / 1.0 velocity
      assert.strictEqual(prodA1.stockStatus, 'healthy')

      const prodA2 = res.products.find((p) => p.productName === 'IntelTest Product A2')
      assert.ok(prodA2)
      assert.strictEqual(prodA2.stockStatus, 'low_stock')
    })
  })

  // ── 3. RETAILER INTELLIGENCE & RISK RANKING ──
  describe('Retailer Intelligence & Risk Ranking', () => {
    it('ranks retailers by total spend and assigns credit trust scores', async () => {
      const res = await analyticsService.getRetailerAnalytics(wholesalerA._id.toString(), { sortBy: 'totalSpent' })
      assert.ok(res.retailers)
      assert.strictEqual(res.retailers.length, 2)

      const ret1 = res.retailers.find((r) => r.name === 'Retailer A1')
      assert.ok(ret1)
      assert.strictEqual(ret1.totalSpent, 3250)
      assert.strictEqual(ret1.deliveredCount, 2)
      assert.strictEqual(ret1.averageOrderValue, 1625)
      assert.strictEqual(ret1.creditUtilization, 20) // 2000 / 10000
      assert.ok(ret1.trustScore >= 75) // Good / Excellent tier
    })
  })

  // ── 4. INVENTORY HEALTH ANALYTICS ──
  describe('Inventory Health & Deficit Analysis', () => {
    it('summarizes low stock, out of stock, and unit deficits', async () => {
      const inv = await analyticsService.getInventoryAnalytics(wholesalerA._id.toString())
      assert.ok(inv.summary)
      assert.strictEqual(inv.summary.totalProducts, 2)
      assert.strictEqual(inv.summary.lowStockCount, 1)
      assert.strictEqual(inv.summary.outOfStockCount, 0)
      assert.strictEqual(inv.summary.totalDeficitUnits, 5) // Product A2: lowStockAt 10 - stock 5 = 5
    })
  })

  // ── 5. RETAILER 360 INSIGHTS ──
  describe('Retailer 360 Deep-Dive Insights', () => {
    it('retrieves detailed metrics, credit profile, trust factors, and smart reorder suggestions for retailer', async () => {
      const insights = await analyticsService.getRetailerInsights(wholesalerA._id.toString(), retailerA1._id.toString())
      assert.ok(insights.retailer)
      assert.strictEqual(insights.retailer._id.toString(), retailerA1._id.toString())
      assert.ok(insights.metrics)
      assert.strictEqual(insights.metrics.totalSpent, 3250)
      assert.ok(insights.trustScore)
      assert.ok(Array.isArray(insights.smartReorderSuggestions))
    })
  })

  // ── 6. STRICT MULTI-TENANT ISOLATION ──
  describe('Multi-Tenant Isolation in Analytics', () => {
    it('prevents Wholesaler A from viewing Wholesaler B retailer insights', async () => {
      await assert.rejects(
        async () => {
          await analyticsService.getRetailerInsights(wholesalerA._id.toString(), retailerB1._id.toString())
        },
        (err) => err.statusCode === 404 || err.message.includes('not found')
      )
    })

    it('ensures Wholesaler A dashboard excludes Wholesaler B revenue and products', async () => {
      const dashboardA = await analyticsService.getExecutiveDashboardAnalytics(wholesalerA._id.toString())
      const dashboardB = await analyticsService.getExecutiveDashboardAnalytics(wholesalerB._id.toString())

      assert.strictEqual(dashboardA.kpis.totalRevenue, 3250)
      assert.strictEqual(dashboardB.kpis.totalRevenue, 1000)

      assert.strictEqual(dashboardA.topProducts.length, 2)
      assert.strictEqual(dashboardB.topProducts[0].productName, 'IntelTest Product B1')
    })
  })
})
