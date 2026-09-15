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

import * as productService from '../src/modules/products/product.service.js'
import * as retailerService from '../src/modules/retailers/retailer.service.js'
import * as salesmanService from '../src/modules/salesmen/salesman.service.js'
import * as orderService from '../src/modules/orders/order.service.js'
import * as creditService from '../src/modules/credit/credit.service.js'
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../src/utils/token.utils.js'

describe('DistroOS P1 Backend Integration Test Suite', () => {
  let wholesalerA, wholesalerB, retailerA, retailerB, salesmanA, salesmanB
  let productA, productB, orderA, orderB

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI)

    // Cleanup previous test data if any
    await User.deleteMany({ email: { $regex: '@p1test\\.com$' } })
    await Product.deleteMany({ name: { $regex: '^P1Test' } })

    wholesalerA = await User.create({
      name: 'P1 Wholesaler A', email: 'wA@p1test.com', password: 'Password123',
      role: 'wholesaler', status: 'active', businessName: 'W-A Corp',
    })
    wholesalerB = await User.create({
      name: 'P1 Wholesaler B', email: 'wB@p1test.com', password: 'Password123',
      role: 'wholesaler', status: 'active', businessName: 'W-B Corp',
    })

    retailerA = await User.create({
      name: 'P1 Retailer A', email: 'rA@p1test.com', password: 'Password123',
      role: 'retailer', status: 'active', wholesaler: wholesalerA._id, businessName: 'R-A Store',
    })
    retailerB = await User.create({
      name: 'P1 Retailer B', email: 'rB@p1test.com', password: 'Password123',
      role: 'retailer', status: 'active', wholesaler: wholesalerB._id, businessName: 'R-B Store',
    })

    salesmanA = await User.create({
      name: 'P1 Salesman A', email: 'sA@p1test.com', password: 'Password123',
      role: 'salesman', status: 'active', wholesaler: wholesalerA._id,
    })
    salesmanB = await User.create({
      name: 'P1 Salesman B', email: 'sB@p1test.com', password: 'Password123',
      role: 'salesman', status: 'active', wholesaler: wholesalerB._id,
    })

    productA = await Product.create({
      wholesaler: wholesalerA._id, name: 'P1Test Product A', price: 150, stock: 20, category: 'Test',
    })
    productB = await Product.create({
      wholesaler: wholesalerB._id, name: 'P1Test Product B', price: 300, stock: 10, category: 'Test',
    })

    await Credit.create({ wholesaler: wholesalerA._id, retailer: retailerA._id, creditLimit: 10000, currentDue: 500 })
    await Credit.create({ wholesaler: wholesalerB._id, retailer: retailerB._id, creditLimit: 20000, currentDue: 1500 })

    orderA = await Order.create({
      wholesaler: wholesalerA._id, retailer: retailerA._id, salesman: salesmanA._id,
      items: [{ product: productA._id, productName: productA.name, quantity: 2, unitPrice: 150, totalPrice: 300 }],
      totalAmount: 300, paymentType: 'cash', status: 'pending',
    })
    orderB = await Order.create({
      wholesaler: wholesalerB._id, retailer: retailerB._id, salesman: salesmanB._id,
      items: [{ product: productB._id, productName: productB.name, quantity: 1, unitPrice: 300, totalPrice: 300 }],
      totalAmount: 300, paymentType: 'cash', status: 'pending',
    })
  })

  after(async () => {
    if (wholesalerA) {
      await User.deleteMany({ email: { $regex: '@p1test\\.com$' } })
      await Product.deleteMany({ name: { $regex: '^P1Test' } })
      await Order.deleteMany({ _id: { $in: [orderA._id, orderB._id] } })
      await Credit.deleteMany({ wholesaler: { $in: [wholesalerA._id, wholesalerB._id] } })
    }
    await mongoose.disconnect()
  })

  // ── AUTH TESTS ──
  describe('Authentication & Token Generation', () => {
    it('generates and verifies access token payload correctly', () => {
      const token = generateAccessToken(wholesalerA)
      const decoded = verifyAccessToken(token)
      assert.strictEqual(decoded.id, wholesalerA._id.toString())
      assert.strictEqual(decoded.role, 'wholesaler')
    })

    it('generates refresh token payload with user ID', () => {
      const refreshToken = generateRefreshToken(wholesalerA)
      assert.ok(refreshToken)
      assert.strictEqual(typeof refreshToken, 'string')
    })
  })

  // ── TENANT ISOLATION TESTS ──
  describe('Multi-Tenant Isolation Constraints', () => {
    it('prevents Wholesaler A from fetching Wholesaler B product', async () => {
      const userAContext = { id: wholesalerA._id.toString(), role: 'wholesaler' }
      await assert.rejects(
        async () => { await productService.getProductById(productB._id, userAContext) },
        (err) => err.statusCode === 404 || err.message.includes('not found')
      )
    })

    it('prevents Wholesaler A from accessing Wholesaler B retailer profile', async () => {
      await assert.rejects(
        async () => { await retailerService.getRetailerById(retailerB._id, wholesalerA._id.toString()) },
        (err) => err.statusCode === 404 || err.message.includes('not found')
      )
    })

    it('prevents Wholesaler A from accessing Wholesaler B salesman profile', async () => {
      await assert.rejects(
        async () => { await salesmanService.getSalesmanById(salesmanB._id, wholesalerA._id.toString()) },
        (err) => err.statusCode === 404 || err.message.includes('not found')
      )
    })

    it('prevents Wholesaler A from viewing Wholesaler B order details', async () => {
      const userAContext = { id: wholesalerA._id.toString(), role: 'wholesaler' }
      await assert.rejects(
        async () => { await orderService.getOrderById(orderB._id, userAContext) },
        (err) => err.statusCode === 403 || err.message.includes('Access denied')
      )
    })
  })

  // ── INVENTORY & CONCURRENCY TESTS ──
  describe('Inventory & Atomic Stock Reservation', () => {
    it('prevents partial stock decrements when any item stock is insufficient', async () => {
      const prod1 = await Product.create({ wholesaler: wholesalerA._id, name: 'P1Test Prod 1', price: 100, stock: 10, category: 'Test' })
      const prod2 = await Product.create({ wholesaler: wholesalerA._id, name: 'P1Test Prod 2', price: 100, stock: 2, category: 'Test' })

      const testOrder = await Order.create({
        wholesaler: wholesalerA._id, retailer: retailerA._id, salesman: salesmanA._id,
        items: [
          { product: prod1._id, productName: prod1.name, quantity: 5, unitPrice: 100, totalPrice: 500 },
          { product: prod2._id, productName: prod2.name, quantity: 10, unitPrice: 100, totalPrice: 1000 },
        ],
        totalAmount: 1500, paymentType: 'cash', status: 'approved',
      })

      const userAContext = { id: wholesalerA._id.toString(), role: 'wholesaler' }

      await assert.rejects(
        async () => { await orderService.updateOrderStatus(testOrder._id, userAContext, 'dispatched') },
        (err) => err.statusCode === 400
      )

      const afterProd1 = await Product.findById(prod1._id)
      const afterProd2 = await Product.findById(prod2._id)
      const afterOrder = await Order.findById(testOrder._id)

      assert.strictEqual(afterProd1.stock, 10)
      assert.strictEqual(afterProd2.stock, 2)
      assert.strictEqual(afterOrder.status, 'approved')
    })
  })

  // ── CREDIT & PAYLOAD OPTIMIZATION TESTS ──
  describe('Credit & Payload Projections', () => {
    it('excludes transactions array in getAllCredit list queries', async () => {
      const res = await creditService.getAllCredit(wholesalerA._id.toString())
      assert.ok(res.credits)
      assert.strictEqual(res.credits.length, 1)
      assert.strictEqual(res.credits[0].transactions, undefined)
    })
  })
})
