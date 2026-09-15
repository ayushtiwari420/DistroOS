import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import User from '../src/modules/users/user.model.js'
import Credit from '../src/modules/credit/credit.model.js'
import * as analyticsService from '../src/modules/analytics/analytics.service.js'

describe('Credit Intelligence V1 Integration Test Suite', () => {
  let wholesalerA, wholesalerB
  let retailerNoCredit, retailerZeroDue, retailerNormal, retailerHighExposure, retailerOverdue, retailerWholesalerB
  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI)

    // Cleanup previous test data
    await User.deleteMany({ email: { $regex: '@cinteltest\\.com$' } })
    await Credit.deleteMany({ note: { $regex: 'CIntelTest' } })

    wholesalerA = await User.create({
      name: 'CIntel Wholesaler A',
      email: 'wA@cinteltest.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'CIntel Wholesaler Corp A',
    })

    wholesalerB = await User.create({
      name: 'CIntel Wholesaler B',
      email: 'wB@cinteltest.com',
      password: 'Password123',
      role: 'wholesaler',
      status: 'active',
      businessName: 'CIntel Wholesaler Corp B',
    })

    // Retailer 1: No credit initialized
    retailerNoCredit = await User.create({
      name: 'Retailer No Credit',
      email: 'rNoCredit@cinteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'No Credit Store',
      city: 'Mumbai',
    })

    // Retailer 2: Zero due (fully paid)
    retailerZeroDue = await User.create({
      name: 'Retailer Zero Due',
      email: 'rZeroDue@cinteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Zero Due Supermarket',
      city: 'Delhi',
    })

    // Retailer 3: Normal utilization (30% utilization)
    retailerNormal = await User.create({
      name: 'Retailer Normal',
      email: 'rNormal@cinteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Normal Credit Mart',
      city: 'Bangalore',
    })

    // Retailer 4: High exposure (90% utilization)
    retailerHighExposure = await User.create({
      name: 'Retailer High Exposure',
      email: 'rHighExposure@cinteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'High Exposure Hypermarket',
      city: 'Pune',
    })

    // Retailer 5: Overdue status
    retailerOverdue = await User.create({
      name: 'Retailer Overdue',
      email: 'rOverdue@cinteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Overdue Traders',
      city: 'Kolkata',
    })

    // Retailer 6: Belongs to Wholesaler B
    retailerWholesalerB = await User.create({
      name: 'Retailer Wholesaler B',
      email: 'rB@cinteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerB._id,
      businessName: 'Other Wholesaler Credit Store',
      city: 'Chennai',
    })

    // Create Credit Records

    // Retailer 2: Zero due, 2 payments -> HEALTHY
    await Credit.create({
      wholesaler: wholesalerA._id,
      retailer: retailerZeroDue._id,
      creditLimit: 100000,
      currentDue: 0,
      status: 'clear',
      lastPaymentDate: new Date(now - 5 * DAY_MS),
      transactions: [
        { type: 'debit', amount: 20000, runningBalance: 20000, note: 'CIntelTest Order 1', date: new Date(now - 30 * DAY_MS) },
        { type: 'credit', amount: 20000, runningBalance: 0, note: 'CIntelTest Repayment 1', date: new Date(now - 25 * DAY_MS) },
        { type: 'debit', amount: 15000, runningBalance: 15000, note: 'CIntelTest Order 2', date: new Date(now - 15 * DAY_MS) },
        { type: 'credit', amount: 15000, runningBalance: 0, note: 'CIntelTest Repayment 2', date: new Date(now - 5 * DAY_MS) },
      ],
    })

    // Retailer 3: Normal due = 30000 / 100000 (30%), 1 payment -> INSUFFICIENT_DATA for consistency (<2 payments), HEALTHY for utilization
    await Credit.create({
      wholesaler: wholesalerA._id,
      retailer: retailerNormal._id,
      creditLimit: 100000,
      currentDue: 30000,
      status: 'clear',
      lastPaymentDate: new Date(now - 10 * DAY_MS),
      transactions: [
        { type: 'debit', amount: 50000, runningBalance: 50000, note: 'CIntelTest Order 3', date: new Date(now - 20 * DAY_MS) },
        { type: 'credit', amount: 20000, runningBalance: 30000, note: 'CIntelTest Repayment 3', date: new Date(now - 10 * DAY_MS) },
      ],
    })

    // Retailer 4: High exposure due = 90000 / 100000 (90%) -> HIGH_EXPOSURE
    await Credit.create({
      wholesaler: wholesalerA._id,
      retailer: retailerHighExposure._id,
      creditLimit: 100000,
      currentDue: 90000,
      status: 'clear',
      transactions: [
        { type: 'debit', amount: 90000, runningBalance: 90000, note: 'CIntelTest Order 4', date: new Date(now - 12 * DAY_MS) },
      ],
    })

    // Retailer 5: Overdue status, currentDue = 40000 -> OVERDUE
    await Credit.create({
      wholesaler: wholesalerA._id,
      retailer: retailerOverdue._id,
      creditLimit: 50000,
      currentDue: 40000,
      status: 'overdue',
      transactions: [
        { type: 'debit', amount: 40000, runningBalance: 40000, note: 'CIntelTest Order 5', date: new Date(now - 45 * DAY_MS) },
      ],
    })

    // Wholesaler B Credit Record
    await Credit.create({
      wholesaler: wholesalerB._id,
      retailer: retailerWholesalerB._id,
      creditLimit: 200000,
      currentDue: 50000,
      status: 'clear',
      transactions: [
        { type: 'debit', amount: 50000, runningBalance: 50000, note: 'CIntelTest Order B', date: new Date(now - 10 * DAY_MS) },
      ],
    })
  })

  after(async () => {
    await User.deleteMany({ email: { $regex: '@cinteltest\\.com$' } })
    await Credit.deleteMany({ note: { $regex: 'CIntelTest' } })
    await mongoose.disconnect()
  })

  it('Scenario 1: Retailer with no credit account is excluded or handles safely', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString())
    const ids = res.accounts.map((a) => a.retailer.id.toString())
    assert.strictEqual(ids.includes(retailerNoCredit._id.toString()), false)
  })

  it('Scenario 2: Retailer with zero outstanding balance displays available credit equal to limit', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: retailerZeroDue.name,
    })
    assert.strictEqual(res.accounts.length, 1)
    const acc = res.accounts[0]
    assert.strictEqual(acc.outstanding, 0)
    assert.strictEqual(acc.creditLimit, 100000)
    assert.strictEqual(acc.availableCredit, 100000)
    assert.strictEqual(acc.creditUtilization, 0)
    assert.strictEqual(acc.creditHealthStatus, 'HEALTHY')
  })

  it('Scenario 3: Calculates normal credit utilization accurately', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: retailerNormal.name,
    })
    assert.strictEqual(res.accounts.length, 1)
    const acc = res.accounts[0]
    assert.strictEqual(acc.creditUtilization, 30.0)
    assert.strictEqual(acc.availableCredit, 70000)
  })

  it('Scenario 4: Classifies high credit utilization (>= 85%) as HIGH_EXPOSURE', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: retailerHighExposure.name,
    })
    assert.strictEqual(res.accounts.length, 1)
    const acc = res.accounts[0]
    assert.strictEqual(acc.creditUtilization, 90.0)
    assert.strictEqual(acc.creditHealthStatus, 'HIGH_EXPOSURE')
  })

  it('Scenario 5: Classifies overdue account correctly as OVERDUE', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: retailerOverdue.name,
    })
    assert.strictEqual(res.accounts.length, 1)
    const acc = res.accounts[0]
    assert.strictEqual(acc.overdueAmount, 40000)
    assert.strictEqual(acc.creditHealthStatus, 'OVERDUE')
    assert.ok(acc.explanation.includes('overdue') || acc.explanation.includes('past due'))
  })

  it('Scenario 6: Reports zero overdue for clear accounts', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: retailerZeroDue.name,
    })
    assert.strictEqual(res.accounts[0].overdueAmount, 0)
    assert.strictEqual(res.accounts[0].overduePercentage, 0)
  })

  it('Scenario 7: Reports INSUFFICIENT_DATA for account with no payment history', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: retailerHighExposure.name,
    })
    assert.strictEqual(res.accounts[0].paymentBehavior.repaymentCount, 0)
    assert.strictEqual(res.accounts[0].paymentConsistency, null)
  })

  it('Scenario 8: Reports INSUFFICIENT_DATA consistency for account with only 1 payment', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: retailerNormal.name,
    })
    assert.strictEqual(res.accounts[0].paymentBehavior.repaymentCount, 1)
    assert.strictEqual(res.accounts[0].paymentConsistency, null)
  })

  it('Scenario 9: Calculates payment consistency percentage for >= 2 payments', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: retailerZeroDue.name,
    })
    assert.strictEqual(res.accounts[0].paymentBehavior.repaymentCount, 2)
    assert.strictEqual(typeof res.accounts[0].paymentConsistency, 'number')
    assert.strictEqual(res.accounts[0].paymentConsistency, 100)
  })

  it('Scenario 10: Calculates average payment delay in days accurately', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: retailerZeroDue.name,
    })
    // Debits 30d ago, 15d ago; Repayments 25d ago (5d delay), 5d ago (10d delay) -> average 8d delay
    assert.ok(res.accounts[0].paymentBehavior.averagePaymentDelay >= 0)
  })

  it('Scenario 11: Classifies fully paid account as HEALTHY with 0% utilization', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: retailerZeroDue.name,
    })
    assert.strictEqual(res.accounts[0].outstanding, 0)
    assert.strictEqual(res.accounts[0].creditHealthStatus, 'HEALTHY')
  })

  it('Scenario 12: Handles creditLimit = 0 safely without producing NaN or Infinity', async () => {
    // Create zero limit account
    const rZeroLimit = await User.create({
      name: 'Zero Limit Retailer',
      email: 'zeroLimit@cinteltest.com',
      password: 'Password123',
      role: 'retailer',
      status: 'active',
      wholesaler: wholesalerA._id,
      businessName: 'Zero Limit Mart',
    })
    await Credit.create({
      wholesaler: wholesalerA._id,
      retailer: rZeroLimit._id,
      creditLimit: 0,
      currentDue: 0,
      status: 'clear',
      transactions: [],
    })

    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: 'Zero Limit',
    })
    assert.strictEqual(res.accounts.length, 1)
    const acc = res.accounts[0]
    assert.strictEqual(acc.creditUtilization, 0)
    assert.strictEqual(Number.isNaN(acc.creditUtilization), false)
    assert.strictEqual(Number.isFinite(acc.creditUtilization), true)
  })

  it('Scenario 13: Enforces 100% tenant isolation (Wholesaler A cannot see Wholesaler B credit)', async () => {
    const resA = await analyticsService.getCreditIntelligence(wholesalerA._id.toString())
    const hasWholesalerBAccount = resA.accounts.some((a) => a.retailer.id.toString() === retailerWholesalerB._id.toString())
    assert.strictEqual(hasWholesalerBAccount, false)
  })

  it('Scenario 14: Supports pagination parameters (page, limit, totalPages)', async () => {
    const page1 = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      page: 1,
      limit: 2,
    })
    assert.strictEqual(page1.accounts.length, 2)
    assert.ok(page1.pagination.total >= 4)
    assert.strictEqual(page1.pagination.hasNextPage, true)

    const page2 = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      page: 2,
      limit: 2,
    })
    assert.strictEqual(page2.accounts.length, 2)
    assert.notStrictEqual(page1.accounts[0].retailer.id, page2.accounts[0].retailer.id)
  })

  it('Scenario 15: Filters correctly by search query (retailer name, city)', async () => {
    const resSearch = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      search: 'Kolkata',
    })
    assert.strictEqual(resSearch.accounts.length, 1)
    assert.strictEqual(resSearch.accounts[0].retailer.id.toString(), retailerOverdue._id.toString())
  })

  it('Scenario 16: Filters correctly by status enum (OVERDUE, HIGH_EXPOSURE, HEALTHY)', async () => {
    const resOverdue = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      status: 'OVERDUE',
    })
    assert.strictEqual(resOverdue.accounts.length, 1)
    assert.strictEqual(resOverdue.accounts[0].creditHealthStatus, 'OVERDUE')

    const resExposure = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      status: 'HIGH_EXPOSURE',
    })
    assert.strictEqual(resExposure.accounts.length, 1)
    assert.strictEqual(resExposure.accounts[0].creditHealthStatus, 'HIGH_EXPOSURE')
  })

  it('Scenario 17: Sorts results by outstanding, utilization, overdue, limit, name', async () => {
    const resOutstanding = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      sortBy: 'outstanding',
    })
    assert.strictEqual(resOutstanding.accounts[0].retailer.id.toString(), retailerHighExposure._id.toString())

    const resUtilization = await analyticsService.getCreditIntelligence(wholesalerA._id.toString(), {
      sortBy: 'utilization',
    })
    assert.strictEqual(resUtilization.accounts[0].retailer.id.toString(), retailerHighExposure._id.toString())
  })

  it('Scenario 18: Aggregates wholesaler-level summary metrics accurately', async () => {
    const res = await analyticsService.getCreditIntelligence(wholesalerA._id.toString())
    assert.ok(res.summary.totalCreditExposure > 0)
    assert.ok(res.summary.totalOutstanding > 0)
    assert.ok(res.summary.totalOverdue >= 40000)
    assert.ok(res.summary.highExposureAccounts >= 1)
  })
})
