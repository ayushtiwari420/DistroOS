import mongoose from 'mongoose'
import Order from '../orders/order.model.js'
import Credit from '../credit/credit.model.js'
import User from '../users/user.model.js'
import Product from '../products/product.model.js'
import { ApiError, StatusCode } from '../../utils/apiError.utils.js'

/**
 * 1. Executive Dashboard Analytics & KPIs
 */
export const getExecutiveDashboardAnalytics = async (wholesalerId, options = {}) => {
  const wholesalerObjId = new mongoose.Types.ObjectId(wholesalerId)
  const filter = { wholesaler: wholesalerObjId }

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  // ── High-Level KPI Tiles ──
  const [totalOrders, deliveredRevenueResult, activeRetailers, lowStockProducts] = await Promise.all([
    Order.countDocuments(filter),
    Order.aggregate([
      { $match: { wholesaler: wholesalerObjId, status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]),
    User.countDocuments({ wholesaler: wholesalerId, role: 'retailer', status: 'active' }),
    Product.countDocuments({
      wholesaler: wholesalerId,
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockAt'] },
    }),
  ])

  const totalRevenue = deliveredRevenueResult[0]?.totalRevenue || 0

  // ── Monthly Revenue & Order Trends ──
  const monthlyTrends = await Order.aggregate([
    { $match: { wholesaler: wholesalerObjId, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0] },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])

  // ── Top 5 Revenue-Generating Products ──
  const topProducts = await Order.aggregate([
    { $match: { wholesaler: wholesalerObjId, status: 'delivered' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$items.productName' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 },
  ])

  // ── Sales Rep Performance Breakdown ──
  const salesRepPerformance = await Order.aggregate([
    { $match: { wholesaler: wholesalerObjId, salesman: { $ne: null } } },
    {
      $group: {
        _id: '$salesman',
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'salesmanInfo',
      },
    },
    { $unwind: '$salesmanInfo' },
    {
      $project: {
        _id: 1,
        name: '$salesmanInfo.name',
        email: '$salesmanInfo.email',
        totalOrders: 1,
        totalRevenue: 1,
      },
    },
    { $sort: { totalRevenue: -1 } },
  ])

  return {
    kpis: {
      totalRevenue,
      totalOrders,
      activeRetailers,
      lowStockAlerts: lowStockProducts,
    },
    monthlyTrends,
    topProducts,
    salesRepPerformance,
  }
}

/**
 * 2. Product Intelligence & Velocity Analytics
 */
export const getProductAnalytics = async (wholesalerId, options = {}) => {
  const { search, category, sortBy = 'revenue', page = 1, limit = 10 } = options
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.max(1, parseInt(limit, 10) || 10)
  const wholesalerObjId = new mongoose.Types.ObjectId(wholesalerId)

  const productFilter = { wholesaler: wholesalerId }
  if (category) productFilter.category = category
  if (search) {
    productFilter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]
  }

  const allProducts = await Product.find(productFilter).lean()

  // ── Sales in the last 30 days for velocity calculation ──
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const productSalesAgg = await Order.aggregate([
    {
      $match: {
        wholesaler: wholesalerObjId,
        status: 'delivered',
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        unitsSold30Days: { $sum: '$items.quantity' },
        totalRevenue30Days: { $sum: '$items.totalPrice' },
      },
    },
  ])

  const salesMap = {}
  productSalesAgg.forEach((item) => {
    salesMap[item._id.toString()] = item
  })

  // ── All-time revenue per product ──
  const allTimeSalesAgg = await Order.aggregate([
    { $match: { wholesaler: wholesalerObjId, status: 'delivered' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalRevenue: { $sum: '$items.totalPrice' },
        totalUnitsSold: { $sum: '$items.quantity' },
      },
    },
  ])

  const allTimeSalesMap = {}
  allTimeSalesAgg.forEach((item) => {
    allTimeSalesMap[item._id.toString()] = item
  })

  const computedProducts = allProducts.map((p) => {
    const pIdStr = p._id.toString()
    const sales30 = salesMap[pIdStr] || { unitsSold30Days: 0, totalRevenue30Days: 0 }
    const allTime = allTimeSalesMap[pIdStr] || { totalRevenue: 0, totalUnitsSold: 0 }

    const unitsSold30Days = sales30.unitsSold30Days
    const dailySalesVelocity = Number((unitsSold30Days / 30).toFixed(2))
    const totalRevenue = allTime.totalRevenue

    const price = p.price || 0
    const costPrice = p.costPrice || 0
    const profitMarginPercent =
      price > 0 ? Number((((price - costPrice) / price) * 100).toFixed(1)) : 0

    const daysOfInventoryRemaining =
      dailySalesVelocity > 0 ? Math.round((p.stock || 0) / dailySalesVelocity) : 999

    let stockStatus = 'healthy'
    if (p.stock === 0) stockStatus = 'out_of_stock'
    else if (p.stock <= (p.lowStockAt || 10)) stockStatus = 'low_stock'

    return {
      productId: p._id,
      productName: p.name,
      category: p.category || 'General',
      unit: p.unit || 'piece',
      price,
      costPrice,
      currentStock: p.stock || 0,
      lowStockAt: p.lowStockAt || 10,
      unitsSold30Days,
      dailySalesVelocity,
      totalRevenue,
      profitMarginPercent,
      daysOfInventoryRemaining,
      stockStatus,
      isActive: p.isActive,
    }
  })

  // ── Sorting ──
  if (sortBy === 'revenue') {
    computedProducts.sort((a, b) => b.totalRevenue - a.totalRevenue)
  } else if (sortBy === 'velocity') {
    computedProducts.sort((a, b) => b.dailySalesVelocity - a.dailySalesVelocity)
  } else if (sortBy === 'demand') {
    computedProducts.sort((a, b) => b.unitsSold30Days - a.unitsSold30Days)
  } else if (sortBy === 'stock') {
    computedProducts.sort((a, b) => a.currentStock - b.currentStock)
  }

  const total = computedProducts.length
  const startIndex = (pageNum - 1) * limitNum
  const paginatedProducts = computedProducts.slice(startIndex, startIndex + limitNum)

  return {
    products: paginatedProducts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
  }
}

/**
 * 3. Retailer Intelligence & Risk Ranking Analytics
 */
export const getRetailerAnalytics = async (wholesalerId, options = {}) => {
  const { riskTier, search, sortBy = 'totalSpent', page = 1, limit = 10 } = options
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.max(1, parseInt(limit, 10) || 10)

  const retailerFilter = { wholesaler: wholesalerId, role: 'retailer' }
  if (search) {
    retailerFilter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ]
  }

  const retailers = await User.find(retailerFilter)
    .select('name email phone businessName city status createdAt')
    .lean()

  const wholesalerObjId = new mongoose.Types.ObjectId(wholesalerId)

  // ── Aggregated Order statistics per retailer ──
  const orderStatsAgg = await Order.aggregate([
    { $match: { wholesaler: wholesalerObjId } },
    {
      $group: {
        _id: '$retailer',
        totalOrders: { $sum: 1 },
        deliveredCount: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
        },
        totalSpent: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0] },
        },
        lastOrderDate: { $max: '$createdAt' },
      },
    },
  ])

  const orderStatsMap = {}
  orderStatsAgg.forEach((item) => {
    orderStatsMap[item._id.toString()] = item
  })

  // ── Credit details per retailer ──
  const credits = await Credit.find({ wholesaler: wholesalerId }).select('-transactions').lean()
  const creditMap = {}
  credits.forEach((c) => {
    creditMap[c.retailer.toString()] = c
  })

  const computedRetailers = []

  for (const r of retailers) {
    const rIdStr = r._id.toString()
    const oStats = orderStatsMap[rIdStr] || {
      totalOrders: 0,
      deliveredCount: 0,
      totalSpent: 0,
      lastOrderDate: null,
    }
    const cInfo = creditMap[rIdStr]

    const totalSpent = oStats.totalSpent
    const totalOrders = oStats.totalOrders
    const deliveredCount = oStats.deliveredCount
    const averageOrderValue = deliveredCount > 0 ? Math.round(totalSpent / deliveredCount) : 0

    // Trust Score Calculation
    let score = 100
    if (r.status === 'suspended' || r.status === 'pending') score -= 40

    if (cInfo) {
      if (cInfo.status === 'blocked') score -= 50
      else if (cInfo.status === 'overdue') score -= 25

      const creditLimit = cInfo.creditLimit || 0
      const currentDue = cInfo.currentDue || 0
      const utilization = creditLimit > 0 ? (currentDue / creditLimit) * 100 : 0
      if (utilization > 95) score -= 30
      else if (utilization > 80) score -= 15

      if (cInfo.lastPaymentDate) {
        const daysSincePayment =
          (Date.now() - new Date(cInfo.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSincePayment <= 30 && cInfo.currentDue === 0) score += 10
      }
    } else {
      score -= 10
    }

    if (deliveredCount >= 5) score += 5

    const trustScore = Math.max(0, Math.min(100, score))
    let calculatedRiskTier = 'High Risk'
    if (trustScore >= 90) calculatedRiskTier = 'Excellent'
    else if (trustScore >= 75) calculatedRiskTier = 'Good'
    else if (trustScore >= 50) calculatedRiskTier = 'Moderate Risk'

    if (riskTier && riskTier.toLowerCase() !== calculatedRiskTier.toLowerCase()) {
      continue
    }

    const creditLimit = cInfo?.creditLimit || 0
    const currentDue = cInfo?.currentDue || 0
    const creditUtilization =
      creditLimit > 0 ? Math.min(100, Math.round((currentDue / creditLimit) * 100)) : 0

    computedRetailers.push({
      retailerId: r._id,
      name: r.name,
      businessName: r.businessName || r.name,
      city: r.city || 'N/A',
      phone: r.phone || '',
      email: r.email,
      accountStatus: r.status,
      totalSpent,
      totalOrders,
      deliveredCount,
      averageOrderValue,
      trustScore,
      riskTier: calculatedRiskTier,
      creditLimit,
      currentDue,
      creditUtilization,
      lastOrderDate: oStats.lastOrderDate,
    })
  }

  // ── Sorting ──
  if (sortBy === 'totalSpent') {
    computedRetailers.sort((a, b) => b.totalSpent - a.totalSpent)
  } else if (sortBy === 'trustScore') {
    computedRetailers.sort((a, b) => b.trustScore - a.trustScore)
  } else if (sortBy === 'lastOrder') {
    computedRetailers.sort(
      (a, b) =>
        new Date(b.lastOrderDate || 0).getTime() - new Date(a.lastOrderDate || 0).getTime()
    )
  } else if (sortBy === 'aov') {
    computedRetailers.sort((a, b) => b.averageOrderValue - a.averageOrderValue)
  }

  const total = computedRetailers.length
  const startIndex = (pageNum - 1) * limitNum
  const paginatedRetailers = computedRetailers.slice(startIndex, startIndex + limitNum)

  return {
    retailers: paginatedRetailers,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
  }
}

/**
 * 4. Inventory Health & Stockout Risk Analytics (Inventory Intelligence V1)
 */
export const getInventoryIntelligence = async (wholesalerId, options = {}) => {
  const { search, category, status, sort, sortBy = sort || 'risk', page = 1, limit = 10 } = options
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.max(1, parseInt(limit, 10) || 10)
  const wholesalerObjId = new mongoose.Types.ObjectId(wholesalerId)

  // 1. Fetch products for wholesaler
  const productFilter = { wholesaler: wholesalerId }
  if (category) productFilter.category = category
  if (search) {
    productFilter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ]
  }

  const products = await Product.find(productFilter).lean()

  // 2. Fetch sales metrics in the last 30 days (excluding cancelled orders)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sales30Agg = await Order.aggregate([
    {
      $match: {
        wholesaler: wholesalerObjId,
        status: { $ne: 'cancelled' },
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        unitsSold30Days: { $sum: '$items.quantity' },
        totalRevenue30Days: { $sum: '$items.totalPrice' },
        orderCount30Days: { $sum: 1 },
        lastSaleDate: { $max: '$createdAt' },
      },
    },
  ])

  const sales30Map = {}
  sales30Agg.forEach((item) => {
    sales30Map[item._id.toString()] = item
  })

  // Summary Counters
  let totalUnits = 0
  let inventoryCostValue = 0
  let potentialSalesValue = 0
  let lowStockCount = 0
  let outOfStockCount = 0
  let fastMovingCount = 0
  let slowMovingCount = 0
  let noRecentSalesCount = 0
  let stockoutRiskCount = 0
  let watchCount = 0
  let safeCount = 0
  let insufficientDataCount = 0

  const allItems = []

  for (const p of products) {
    const pIdStr = p._id.toString()
    const stock = Math.max(0, p.stock || 0)
    const lowStockAt = Math.max(0, p.lowStockAt || 0)
    const costPrice = p.costPrice || 0
    const price = p.price || 0

    const salesData = sales30Map[pIdStr] || {
      unitsSold30Days: 0,
      totalRevenue30Days: 0,
      orderCount30Days: 0,
      lastSaleDate: null,
    }

    const unitsSold30Days = salesData.unitsSold30Days || 0
    const totalRevenue30Days = salesData.totalRevenue30Days || 0
    const orderCount30Days = salesData.orderCount30Days || 0
    const lastSaleDate = salesData.lastSaleDate || null

    const dailySalesVelocity = Number((unitsSold30Days / 30).toFixed(2))
    const itemCostValue = stock * costPrice
    const itemSalesValue = stock * price

    totalUnits += stock
    inventoryCostValue += itemCostValue
    potentialSalesValue += itemSalesValue

    const isLowStock = stock <= lowStockAt
    const shortageAmount = Math.max(0, lowStockAt - stock)

    if (stock === 0) outOfStockCount++
    if (isLowStock) lowStockCount++

    // Movement status classification
    let movementStatus = 'NORMAL'
    if (unitsSold30Days === 0) {
      movementStatus = 'NO_RECENT_SALES'
      noRecentSalesCount++
    } else if (dailySalesVelocity >= 3.0) {
      movementStatus = 'FAST_MOVING'
      fastMovingCount++
    } else if (dailySalesVelocity < 0.2) {
      movementStatus = 'SLOW_MOVING'
      slowMovingCount++
    } else {
      movementStatus = 'NORMAL'
    }

    // Stockout risk classification & estimated days of stock
    let estimatedDaysOfStock = 999
    let stockoutRiskStatus = 'SAFE'
    let explanation = ''

    if (stock === 0) {
      estimatedDaysOfStock = 0
      stockoutRiskStatus = 'STOCKOUT_RISK'
      stockoutRiskCount++
      explanation = `Out of stock! Low-stock threshold is ${lowStockAt} ${p.unit || 'units'}.`
    } else if (isLowStock) {
      estimatedDaysOfStock = dailySalesVelocity > 0 ? Math.round(stock / dailySalesVelocity) : 999
      stockoutRiskStatus = 'STOCKOUT_RISK'
      stockoutRiskCount++
      explanation = `Stockout Risk: Current stock (${stock} ${p.unit || 'units'}) is at or below low-stock threshold (${lowStockAt} ${p.unit || 'units'}).`
    } else if (dailySalesVelocity === 0) {
      estimatedDaysOfStock = 999
      stockoutRiskStatus = 'INSUFFICIENT_DATA'
      insufficientDataCount++
      explanation = `Stock is ${stock} ${p.unit || 'units'}. No sales recorded in the last 30 days to calculate depletion velocity.`
    } else {
      estimatedDaysOfStock = Math.round(stock / dailySalesVelocity)
      if (estimatedDaysOfStock <= 7) {
        stockoutRiskStatus = 'STOCKOUT_RISK'
        stockoutRiskCount++
        explanation = `Stockout Risk: Current stock is ${stock} ${p.unit || 'units'} with sales velocity of ${dailySalesVelocity} ${p.unit || 'units'}/day (est. ${estimatedDaysOfStock} days remaining).`
      } else if (estimatedDaysOfStock <= 14) {
        stockoutRiskStatus = 'WATCH'
        watchCount++
        explanation = `Watch: Stock of ${stock} ${p.unit || 'units'} estimated to last ${estimatedDaysOfStock} days at current velocity (${dailySalesVelocity} ${p.unit || 'units'}/day).`
      } else {
        stockoutRiskStatus = 'SAFE'
        safeCount++
        explanation = `Safe: Healthy stock level (${stock} ${p.unit || 'units'}) with estimated coverage of ${estimatedDaysOfStock} days.`
      }
    }

    if (movementStatus === 'SLOW_MOVING') {
      explanation += ` Slow-moving: Only ${unitsSold30Days} ${p.unit || 'units'} sold in the last 30 days.`
    } else if (movementStatus === 'NO_RECENT_SALES' && stock > 0) {
      explanation += ` No recent sales in the last 30 days.`
    }

    const item = {
      product: {
        id: p._id,
        name: p.name,
        sku: p.sku || '',
        category: p.category || 'General',
        unit: p.unit || 'piece',
        price,
        costPrice,
        stock,
        lowStockAt,
        isActive: p.isActive,
      },
      stock,
      lowStockAt,
      isLowStock,
      shortageAmount,
      unitsSold30Days,
      totalRevenue30Days,
      orderCount30Days,
      dailySalesVelocity,
      lastSaleDate,
      estimatedDaysOfStock,
      movementStatus,
      stockoutRiskStatus,
      inventoryCostValue: itemCostValue,
      potentialSalesValue: itemSalesValue,
      explanation,
    }

    // Status filter matching
    if (status) {
      const uStatus = status.toUpperCase()
      let matchesFilter = false
      if (uStatus === 'LOW_STOCK' && isLowStock) matchesFilter = true
      else if (uStatus === 'OUT_OF_STOCK' && stock === 0) matchesFilter = true
      else if (uStatus === movementStatus) matchesFilter = true
      else if (uStatus === stockoutRiskStatus) matchesFilter = true

      if (!matchesFilter) continue
    }

    allItems.push(item)
  }

  // 3. Sorting
  if (sortBy === 'risk') {
    const riskOrder = { STOCKOUT_RISK: 1, WATCH: 2, INSUFFICIENT_DATA: 3, SAFE: 4 }
    allItems.sort((a, b) => {
      const rA = riskOrder[a.stockoutRiskStatus] || 99
      const rB = riskOrder[b.stockoutRiskStatus] || 99
      if (rA !== rB) return rA - rB
      return a.estimatedDaysOfStock - b.estimatedDaysOfStock
    })
  } else if (sortBy === 'velocity') {
    allItems.sort((a, b) => b.dailySalesVelocity - a.dailySalesVelocity)
  } else if (sortBy === 'value') {
    allItems.sort((a, b) => b.inventoryCostValue - a.inventoryCostValue)
  } else if (sortBy === 'stock') {
    allItems.sort((a, b) => a.stock - b.stock)
  } else if (sortBy === 'revenue') {
    allItems.sort((a, b) => b.totalRevenue30Days - a.totalRevenue30Days)
  } else if (sortBy === 'name') {
    allItems.sort((a, b) => a.product.name.localeCompare(b.product.name))
  }

  const total = allItems.length
  const startIndex = (pageNum - 1) * limitNum
  const paginatedItems = allItems.slice(startIndex, startIndex + limitNum)
  const totalPages = Math.ceil(total / limitNum) || 1

  return {
    summary: {
      totalProducts: products.length,
      totalUnits,
      inventoryCostValue,
      potentialSalesValue,
      lowStockCount,
      outOfStockCount,
      fastMovingCount,
      slowMovingCount,
      noRecentSalesCount,
      stockoutRiskCount,
      watchCount,
      safeCount,
      insufficientDataCount,
    },
    products: paginatedItems,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
    },
  }
}

export const getInventoryAnalytics = async (wholesalerId, options = {}) => {
  const data = await getInventoryIntelligence(wholesalerId, { ...options, limit: 100 })
  return {
    summary: {
      totalProducts: data.summary.totalProducts,
      lowStockCount: data.summary.lowStockCount,
      outOfStockCount: data.summary.outOfStockCount,
      totalDeficitUnits: data.products.reduce((acc, p) => acc + p.shortageAmount, 0),
      inventoryCostValue: data.summary.inventoryCostValue,
      potentialSalesValue: data.summary.potentialSalesValue,
    },
    inventoryHealth: data.products.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      category: item.product.category,
      currentStock: item.stock,
      lowStockAt: item.lowStockAt,
      stockDeficit: item.shortageAmount,
      unitsSold30Days: item.unitsSold30Days,
      dailyVelocity: item.dailySalesVelocity,
      estimatedDaysToStockout: item.estimatedDaysOfStock,
      reorderRecommended: item.stockoutRiskStatus === 'STOCKOUT_RISK' || item.isLowStock,
      movementStatus: item.movementStatus,
      stockoutRiskStatus: item.stockoutRiskStatus,
      inventoryCostValue: item.inventoryCostValue,
      potentialSalesValue: item.potentialSalesValue,
      explanation: item.explanation,
    })),
  }
}

/**
 * 5. Deep-Dive Retailer 360 Insights
 */
export const getRetailerInsights = async (wholesalerId, retailerId) => {
  const retailer = await User.findOne({
    _id: retailerId,
    role: 'retailer',
    wholesaler: wholesalerId,
  }).select('name email phone businessName city status createdAt').lean()

  if (!retailer) {
    throw new ApiError(StatusCode.NOT_FOUND, 'Retailer not found in your network.')
  }

  const credit = await Credit.findOne({ wholesaler: wholesalerId, retailer: retailerId }).lean()

  const orders = await Order.find({ wholesaler: wholesalerId, retailer: retailerId })
    .populate('items.product', 'name unit price category')
    .populate('salesman', 'name email phone')
    .sort({ createdAt: -1 })
    .lean()

  const assignedSalesman = orders.find((o) => o.salesman)?.salesman || null

  const deliveredOrders = orders.filter((o) => o.status === 'delivered')
  const totalSpent = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalOrders = orders.length
  const deliveredCount = deliveredOrders.length
  const averageOrderValue = deliveredCount > 0 ? Math.round(totalSpent / deliveredCount) : 0

  let avgOrderIntervalDays = 0
  if (deliveredOrders.length > 1) {
    const dates = deliveredOrders
      .map((o) => new Date(o.createdAt).getTime())
      .sort((a, b) => a - b)
    const intervals = []
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24))
    }
    avgOrderIntervalDays = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
  }

  // ── Top Purchased Products ──
  const productMap = {}
  orders.forEach((o) => {
    o.items.forEach((item) => {
      const pid = item.product?._id?.toString() || item.productName
      if (!productMap[pid]) {
        productMap[pid] = {
          productId: pid,
          productName: item.productName,
          category: item.product?.category || 'General',
          totalQuantity: 0,
          totalSpent: 0,
        }
      }
      productMap[pid].totalQuantity += item.quantity
      productMap[pid].totalSpent += item.totalPrice
    })
  })

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5)

  // ── Credit Profile ──
  const hasCredit = Boolean(credit)
  const creditLimit = credit?.creditLimit || 0
  const currentDue = credit?.currentDue || 0
  const availableCredit = Math.max(0, creditLimit - currentDue)
  const creditUtilization =
    creditLimit > 0 ? Math.min(100, Math.round((currentDue / creditLimit) * 100)) : 0

  // ── Payment Behavior & History ──
  const paymentTypeDistribution = { cash: 0, credit: 0, upi: 0 }
  const paymentStatusDistribution = { paid: 0, partial: 0, unpaid: 0 }
  let totalPaid = 0
  let totalOutstandingBalance = 0

  orders.forEach((o) => {
    if (o.paymentType && paymentTypeDistribution[o.paymentType] !== undefined) {
      paymentTypeDistribution[o.paymentType]++
    }
    if (o.paymentStatus && paymentStatusDistribution[o.paymentStatus] !== undefined) {
      paymentStatusDistribution[o.paymentStatus]++
    }
    totalPaid += o.amountPaid || 0
    totalOutstandingBalance += o.balanceDue || 0
  })

  // ── Activity Timeline Construction (Real Database Events Only) ──
  const timelineEvents = []

  if (retailer.createdAt) {
    timelineEvents.push({
      id: `reg-${retailer._id}`,
      type: 'account_created',
      title: 'Retailer Account Registered',
      description: `Account initialized for ${retailer.businessName || retailer.name}`,
      timestamp: retailer.createdAt,
    })
  }

  orders.forEach((o) => {
    timelineEvents.push({
      id: `ord-${o._id}`,
      type: 'order_placed',
      title: `Order #${o.orderNumber || o._id.toString().slice(-6)} (${o.status.toUpperCase()})`,
      description: `${o.items?.length || 0} items • Amount: ₹${(o.totalAmount || 0).toLocaleString('en-IN')}`,
      status: o.status,
      amount: o.totalAmount,
      timestamp: o.createdAt,
    })
  })

  if (credit?.transactions && Array.isArray(credit.transactions)) {
    credit.transactions.forEach((tx) => {
      timelineEvents.push({
        id: `tx-${tx._id}`,
        type: tx.type === 'credit' ? 'payment_recorded' : 'credit_debit',
        title: tx.type === 'credit' ? `Credit Repayment Received` : `Credit Balance Adjusted`,
        description: `Amount: ₹${(tx.amount || 0).toLocaleString('en-IN')} ${tx.note ? `• Note: ${tx.note}` : ''}`,
        amount: tx.amount,
        timestamp: tx.date || tx.createdAt || new Date(),
      })
    })
  }

  timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // ── Trust Score Calculation ──
  let score = 100
  const factors = []

  if (retailer.status === 'suspended' || retailer.status === 'pending') {
    score -= 40
    factors.push(`Retailer account status is ${retailer.status} (-40 pts)`)
  }

  if (credit) {
    if (credit.status === 'blocked') {
      score -= 50
      factors.push('Credit account status is blocked (-50 pts)')
    } else if (credit.status === 'overdue') {
      score -= 25
      factors.push('Outstanding overdue balance present (-25 pts)')
    }

    if (creditUtilization > 95) {
      score -= 30
      factors.push(`Critical credit limit utilization ${Math.round(creditUtilization)}% (-30 pts)`)
    } else if (creditUtilization > 80) {
      score -= 15
      factors.push(`High credit limit utilization ${Math.round(creditUtilization)}% (-15 pts)`)
    }

    if (credit.lastPaymentDate) {
      const daysSincePayment =
        (Date.now() - new Date(credit.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSincePayment <= 30 && credit.currentDue === 0) {
        score += 10
        factors.push('Timely payment completed within last 30 days (+10 pts)')
      }
    }
  } else {
    score -= 10
    factors.push('No formal credit account initialized (-10 pts)')
  }

  if (deliveredCount >= 5) {
    score += 5
    factors.push(`Consistent order fulfillment history (${deliveredCount} delivered orders) (+5 pts)`)
  }

  const trustScoreValue = Math.max(0, Math.min(100, score))
  let tier = 'High Risk'
  if (trustScoreValue >= 90) tier = 'Excellent'
  else if (trustScoreValue >= 75) tier = 'Good'
  else if (trustScoreValue >= 50) tier = 'Moderate Risk'

  const smartReorderSuggestions = await getSmartReorderSuggestions(wholesalerId, retailerId)

  return {
    retailer: {
      ...retailer,
      assignedSalesman,
    },
    metrics: {
      totalSpent,
      totalOrders,
      deliveredCount,
      averageOrderValue,
      outstandingCredit: currentDue,
      lastOrderDate: orders[0]?.createdAt || null,
    },
    purchaseBehavior: {
      totalOrders,
      deliveredOrdersCount: deliveredCount,
      pendingOrdersCount: orders.filter((o) => o.status === 'pending').length,
      dispatchedOrdersCount: orders.filter((o) => o.status === 'dispatched').length,
      cancelledOrdersCount: orders.filter((o) => o.status === 'cancelled').length,
      avgOrderIntervalDays,
      paymentTypeDistribution,
    },
    topProducts,
    recentOrders: orders.slice(0, 10),
    creditOverview: {
      hasCredit,
      creditLimit,
      currentDue,
      availableCredit,
      creditUtilization,
      status: credit?.status || 'clear',
      lastPaymentDate: credit?.lastPaymentDate || null,
      transactionCount: credit?.transactions?.length || 0,
    },
    paymentHistory: {
      totalPaid,
      totalOutstandingBalance,
      paymentStatusDistribution,
      recentTransactions: credit?.transactions ? [...credit.transactions].reverse().slice(0, 10) : [],
    },
    activityTimeline: timelineEvents,
    trustScore: {
      score: trustScoreValue,
      tier,
      factors,
      lastEvaluated: new Date(),
    },
    smartReorderSuggestions,
  }
}

/**
 * Backwards Compatible Alias for Retailer 360
 */
export const getRetailer360 = async (wholesalerId, retailerId) => {
  return getRetailerInsights(wholesalerId, retailerId)
}

/**
 * Smart Reorder V1 Recommendation Engine
 */
export const getSmartReorderRecommendations = async (wholesalerId, options = {}) => {
  const { status, retailer, product, search, page = 1, limit = 20 } = options
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.max(1, parseInt(limit, 10) || 20)

  const wholesalerObjId = new mongoose.Types.ObjectId(wholesalerId)

  // 1. Single-pass aggregation over non-cancelled orders for wholesaler
  const aggResult = await Order.aggregate([
    {
      $match: {
        wholesaler: wholesalerObjId,
        status: { $ne: 'cancelled' },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          retailer: '$retailer',
          product: '$items.product',
        },
        productName: { $first: '$items.productName' },
        orderDates: { $push: '$createdAt' },
        quantities: { $push: '$items.quantity' },
        totalOrdersCount: { $sum: 1 },
        totalQuantityPurchased: { $sum: '$items.quantity' },
      },
    },
  ])

  // 2. Fetch active products & retailers for wholesaler in parallel
  const [activeProducts, activeRetailers] = await Promise.all([
    Product.find({ wholesaler: wholesalerId, isActive: true }).select('name category unit price stock').lean(),
    User.find({ wholesaler: wholesalerId, role: 'retailer' }).select('name businessName city email status').lean(),
  ])

  const productMap = {}
  activeProducts.forEach((p) => {
    productMap[p._id.toString()] = p
  })

  const retailerMap = {}
  activeRetailers.forEach((r) => {
    retailerMap[r._id.toString()] = r
  })

  const now = Date.now()
  const allRecommendations = []

  for (const item of aggResult) {
    const rId = item._id.retailer?.toString()
    const pId = item._id.product?.toString()

    const rObj = retailerMap[rId]
    const pObj = productMap[pId]

    // Exclude if retailer is no longer active in wholesaler network or product is inactive
    if (!rObj || !pObj) continue

    // Sort order dates ascending
    const sortedDates = item.orderDates
      .map((d) => new Date(d).getTime())
      .filter((t) => !isNaN(t))
      .sort((a, b) => a - b)

    if (sortedDates.length === 0) continue

    const totalOrders = sortedDates.length
    const firstPurchaseDate = new Date(sortedDates[0])
    const lastPurchaseDate = new Date(sortedDates[sortedDates.length - 1])
    const daysSinceLastPurchase = Math.max(0, Math.floor((now - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)))

    const avgQuantity = Math.max(
      1,
      Math.round(item.quantities.reduce((a, b) => a + Number(b || 0), 0) / item.quantities.length)
    )

    let recommendationStatus = 'INSUFFICIENT_DATA'
    let averageOrderInterval = 0
    let explanation = ''

    if (totalOrders < 2) {
      recommendationStatus = 'INSUFFICIENT_DATA'
      averageOrderInterval = 0
      explanation = `${rObj.businessName || rObj.name} has purchased ${pObj.name} only once. At least 2 orders are required to calculate a reorder interval.`
    } else {
      // Calculate intervals between consecutive purchases
      const intervals = []
      for (let i = 1; i < sortedDates.length; i++) {
        const diffDays = Math.round((sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24))
        if (diffDays > 0) {
          intervals.push(diffDays)
        }
      }

      if (intervals.length === 0) {
        // Multiple purchases on the exact same day
        recommendationStatus = 'INSUFFICIENT_DATA'
        averageOrderInterval = 0
        explanation = `${rObj.businessName || rObj.name} placed multiple orders for ${pObj.name} on the same day. More distinct purchase days are required.`
      } else {
        averageOrderInterval = Math.max(1, Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length))

        if (daysSinceLastPurchase >= averageOrderInterval) {
          recommendationStatus = 'REORDER_DUE'
          explanation = `${rObj.businessName || rObj.name} usually purchases ${pObj.name} every ${averageOrderInterval} days. Their last purchase was ${daysSinceLastPurchase} days ago (Typical quantity: ${avgQuantity} ${pObj.unit || 'units'}).`
        } else if (daysSinceLastPurchase >= Math.round(averageOrderInterval * 0.75)) {
          recommendationStatus = 'DUE_SOON'
          explanation = `${rObj.businessName || rObj.name} purchases ${pObj.name} every ${averageOrderInterval} days. Reorder is expected soon (last purchase ${daysSinceLastPurchase} days ago).`
        } else {
          recommendationStatus = 'NOT_DUE'
          explanation = `${rObj.businessName || rObj.name} purchased ${pObj.name} ${daysSinceLastPurchase} days ago. Next reorder expected in ${averageOrderInterval - daysSinceLastPurchase} days.`
        }
      }
    }

    const suggestedQuantity = avgQuantity

    // Check optional filters
    if (status && status.toUpperCase() !== recommendationStatus) continue
    if (retailer && retailer !== rId) continue
    if (product && product !== pId) continue

    if (search) {
      const q = search.toLowerCase()
      const rNameMatch =
        (rObj.businessName || '').toLowerCase().includes(q) || (rObj.name || '').toLowerCase().includes(q)
      const pNameMatch = (pObj.name || '').toLowerCase().includes(q)
      if (!rNameMatch && !pNameMatch) continue
    }

    allRecommendations.push({
      retailer: {
        id: rObj._id,
        name: rObj.businessName || rObj.name,
        contactName: rObj.name,
        email: rObj.email,
        city: rObj.city || '',
      },
      product: {
        id: pObj._id,
        name: pObj.name,
        category: pObj.category || 'General',
        unit: pObj.unit || 'piece',
        price: pObj.price || 0,
        stock: pObj.stock || 0,
      },
      status: recommendationStatus,
      averageOrderInterval,
      daysSinceLastPurchase,
      averageQuantity: avgQuantity,
      suggestedQuantity,
      firstPurchaseDate,
      lastPurchaseDate,
      totalOrdersCount: totalOrders,
      totalQuantityPurchased: item.totalQuantityPurchased,
      explanation,
    })
  }

  // Priority sorting: REORDER_DUE > DUE_SOON > NOT_DUE > INSUFFICIENT_DATA
  const statusPriority = { REORDER_DUE: 1, DUE_SOON: 2, NOT_DUE: 3, INSUFFICIENT_DATA: 4 }
  allRecommendations.sort((a, b) => {
    const pA = statusPriority[a.status] || 99
    const pB = statusPriority[b.status] || 99
    if (pA !== pB) return pA - pB
    return b.daysSinceLastPurchase - b.averageOrderInterval - (a.daysSinceLastPurchase - a.averageOrderInterval)
  })

  const total = allRecommendations.length
  const startIndex = (pageNum - 1) * limitNum
  const paginatedRecommendations = allRecommendations.slice(startIndex, startIndex + limitNum)
  const totalPages = Math.ceil(total / limitNum) || 1

  return {
    recommendations: paginatedRecommendations,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
    },
  }
}

/**
 * Smart Reorder Suggestions Generator (Backwards Compatible Format)
 */
export const getSmartReorderSuggestions = async (wholesalerId, retailerId = null) => {
  const options = retailerId ? { retailer: retailerId } : {}
  const res = await getSmartReorderRecommendations(wholesalerId, options)
  return res.recommendations.map((item) => ({
    retailerId: item.retailer.id,
    retailerName: item.retailer.name,
    productId: item.product.id,
    productName: item.product.name,
    totalOrdersCount: item.totalOrdersCount,
    lastOrderDate: item.lastPurchaseDate,
    averageQuantity: item.averageQuantity,
    averageIntervalDays: item.averageOrderInterval,
    expectedReorderDate: new Date(new Date(item.lastPurchaseDate).getTime() + item.averageOrderInterval * 86400000),
    daysUntilReorder: item.averageOrderInterval - item.daysSinceLastPurchase,
    status: item.status === 'REORDER_DUE' ? 'overdue_reorder' : item.status === 'DUE_SOON' ? 'reorder_due_soon' : 'on_track',
    suggestedQuantity: item.suggestedQuantity,
    explanation: item.explanation,
  }))
}

/**
 * Standalone Credit Trust Score Generator
 */
export const calculateCreditTrustScore = async (wholesalerId, retailerId) => {
  const insights = await getRetailerInsights(wholesalerId, retailerId)
  return {
    retailerId,
    trustScore: insights.trustScore.score,
    tier: insights.trustScore.tier,
    factors: insights.trustScore.factors,
    lastEvaluated: insights.trustScore.lastEvaluated,
  }
}

/**
 * Aggregated Network Demand Generator
 */
export const getNetworkAggregatedDemand = async (wholesalerId) => {
  const filter = { wholesaler: new mongoose.Types.ObjectId(wholesalerId) }

  const products = await Product.find({ wholesaler: wholesalerId })
    .select('name category stock lowStockAt price')
    .lean()
  const productStockMap = {}
  products.forEach((p) => {
    productStockMap[p._id.toString()] = {
      stock: p.stock,
      lowStockAt: p.lowStockAt,
      price: p.price,
      category: p.category,
    }
  })

  const productDemandAggregation = await Order.aggregate([
    { $match: filter },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$items.productName' },
        totalQuantityDemanded: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantityDemanded: -1 } },
  ])

  const productDemand = productDemandAggregation.map((item) => {
    const pid = item._id ? item._id.toString() : null
    const stockInfo = pid ? productStockMap[pid] : null
    const currentStock = stockInfo ? stockInfo.stock : 0
    const deficit = Math.max(0, item.totalQuantityDemanded - currentStock)

    return {
      productId: pid,
      productName: item.productName,
      totalQuantityDemanded: item.totalQuantityDemanded,
      totalRevenue: item.totalRevenue,
      orderCount: item.orderCount,
      currentStock,
      stockDeficit: deficit,
      reorderRequired: deficit > 0 || (stockInfo && currentStock <= stockInfo.lowStockAt),
    }
  })

  const statusDistribution = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
  ])

  const retailerStats = await User.aggregate([
    { $match: { wholesaler: new mongoose.Types.ObjectId(wholesalerId), role: 'retailer' } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ])

  const connectedSalesmenCount = await User.countDocuments({
    wholesaler: wholesalerId,
    role: 'salesman',
  })

  return {
    summary: {
      totalProductsTracked: products.length,
      totalActiveDemandUnits: productDemand.reduce((sum, p) => sum + p.totalQuantityDemanded, 0),
      totalDeficitProducts: productDemand.filter((p) => p.stockDeficit > 0).length,
      connectedSalesmen: connectedSalesmenCount,
    },
    productDemand,
    statusDistribution,
    retailerStats,
  }
}

/**
 * 6. Credit Intelligence & Account Risk Analytics V1
 */
export const getCreditIntelligence = async (wholesalerId, options = {}) => {
  const { search, status, sort, sortBy = sort || 'outstanding', page = 1, limit = 10 } = options
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.max(1, parseInt(limit, 10) || 10)

  // 1. Fetch all credit accounts for wholesaler
  const credits = await Credit.find({ wholesaler: wholesalerId })
    .populate('retailer', 'name businessName phone city email status')
    .lean()

  let totalCreditExposure = 0
  let totalOutstanding = 0
  let totalOverdue = 0
  let retailersWithCredit = 0
  let retailersOverdue = 0
  let highExposureAccounts = 0
  let sumConsistency = 0
  let countConsistency = 0

  const allAccounts = []

  for (const c of credits) {
    if (!c.retailer) continue

    const rObj = c.retailer
    const creditLimit = Math.max(0, c.creditLimit || 0)
    const outstanding = Math.max(0, c.currentDue || 0)
    const availableCredit = Math.max(0, creditLimit - outstanding)
    const creditUtilization = creditLimit > 0 ? Number(((outstanding / creditLimit) * 100).toFixed(1)) : 0

    const isOverdueStatus = c.status === 'overdue' || c.status === 'blocked'
    const overdueAmount = isOverdueStatus ? outstanding : 0
    const overduePercentage = outstanding > 0 ? Number(((overdueAmount / outstanding) * 100).toFixed(1)) : 0

    totalCreditExposure += creditLimit
    totalOutstanding += outstanding
    totalOverdue += overdueAmount

    if (creditLimit > 0) retailersWithCredit++
    if (overdueAmount > 0) retailersOverdue++
    if (creditUtilization >= 85.0) highExposureAccounts++

    // Payment Behavior Analysis from transactions
    const txs = Array.isArray(c.transactions) ? c.transactions : []
    const repayments = txs.filter((t) => t.type === 'credit')
    const debits = txs.filter((t) => t.type === 'debit')

    const repaymentCount = repayments.length
    const totalAmountPaid = repayments.reduce((s, t) => s + (t.amount || 0), 0)
    const averagePaymentAmount = repaymentCount > 0 ? Math.round(totalAmountPaid / repaymentCount) : 0
    const lastPaymentDate = c.lastPaymentDate || (repayments.length > 0 ? repayments[repayments.length - 1].date : null)

    // Calculate payment delays & on-time repayments (within 15 days of preceding debit)
    let onTimeCount = 0
    const delays = []

    for (const rTx of repayments) {
      const rTime = new Date(rTx.date || rTx.createdAt || Date.now()).getTime()
      // Find nearest preceding debit
      const prevDebits = debits.filter((dTx) => new Date(dTx.date || dTx.createdAt || 0).getTime() <= rTime)
      if (prevDebits.length > 0) {
        const lastDebitTime = new Date(prevDebits[prevDebits.length - 1].date || prevDebits[prevDebits.length - 1].createdAt).getTime()
        const delayDays = Math.max(0, Math.round((rTime - lastDebitTime) / (1000 * 60 * 60 * 24)))
        delays.push(delayDays)
        if (delayDays <= 15) onTimeCount++
      } else {
        onTimeCount++ // No preceding debit timestamp found, treat as on-time
      }
    }

    const averagePaymentDelay = delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0

    // Payment consistency metric: requires at least 2 repayments
    let paymentConsistency = null
    if (repaymentCount >= 2) {
      paymentConsistency = Math.min(100, Math.round((onTimeCount / repaymentCount) * 100))
      sumConsistency += paymentConsistency
      countConsistency++
    }

    // Health Classification Rules
    let creditHealthStatus = 'INSUFFICIENT_DATA'
    let explanation = ''

    if (overdueAmount > 0 || isOverdueStatus) {
      creditHealthStatus = 'OVERDUE'
      explanation = `Overdue: ₹${overdueAmount.toLocaleString('en-IN')} is currently past due.`
    } else if (creditUtilization >= 85.0) {
      creditHealthStatus = 'HIGH_EXPOSURE'
      explanation = `High Exposure: Outstanding credit (₹${outstanding.toLocaleString('en-IN')}) represents ${creditUtilization}% of assigned limit.`
    } else if (creditUtilization >= 60.0 || (paymentConsistency !== null && paymentConsistency < 70)) {
      creditHealthStatus = 'WATCH'
      explanation = `Watch: Utilization is ${creditUtilization}% ${paymentConsistency !== null ? `with ${paymentConsistency}% payment consistency` : ''}.`
    } else if (outstanding > 0 || creditLimit > 0) {
      creditHealthStatus = 'HEALTHY'
      explanation = `Healthy: Outstanding balance is within normal limits (${creditUtilization}% utilization) with consistent payment behavior.`
    } else {
      creditHealthStatus = 'INSUFFICIENT_DATA'
      explanation = `Insufficient history: Not enough transaction data to calculate a reliable credit assessment.`
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      const nameMatch = (rObj.name || '').toLowerCase().includes(q) || (rObj.businessName || '').toLowerCase().includes(q)
      const cityMatch = (rObj.city || '').toLowerCase().includes(q)
      if (!nameMatch && !cityMatch) continue
    }

    // Status filter
    if (status) {
      const uStatus = status.toUpperCase()
      if (uStatus !== creditHealthStatus) continue
    }

    allAccounts.push({
      retailer: {
        id: rObj._id,
        name: rObj.businessName || rObj.name,
        contactName: rObj.name,
        phone: rObj.phone || '',
        city: rObj.city || '',
        email: rObj.email,
        status: rObj.status,
      },
      creditLimit,
      outstanding,
      availableCredit,
      creditUtilization,
      overdueAmount,
      overduePercentage,
      accountStatus: c.status,
      paymentBehavior: {
        repaymentCount,
        totalAmountPaid,
        averagePaymentAmount,
        lastPaymentDate,
        averagePaymentDelay,
      },
      paymentConsistency,
      creditHealthStatus,
      explanation,
    })
  }

  // 2. Sorting
  if (sortBy === 'outstanding') {
    allAccounts.sort((a, b) => b.outstanding - a.outstanding)
  } else if (sortBy === 'utilization') {
    allAccounts.sort((a, b) => b.creditUtilization - a.creditUtilization)
  } else if (sortBy === 'overdue') {
    allAccounts.sort((a, b) => b.overdueAmount - a.overdueAmount)
  } else if (sortBy === 'limit') {
    allAccounts.sort((a, b) => b.creditLimit - a.creditLimit)
  } else if (sortBy === 'consistency') {
    allAccounts.sort((a, b) => (b.paymentConsistency || 0) - (a.paymentConsistency || 0))
  } else if (sortBy === 'name') {
    allAccounts.sort((a, b) => a.retailer.name.localeCompare(b.retailer.name))
  }

  const total = allAccounts.length
  const startIndex = (pageNum - 1) * limitNum
  const paginatedAccounts = allAccounts.slice(startIndex, startIndex + limitNum)
  const totalPages = Math.ceil(total / limitNum) || 1

  const averagePaymentConsistency = countConsistency > 0 ? Math.round(sumConsistency / countConsistency) : null

  return {
    summary: {
      totalCreditExposure,
      totalOutstanding,
      totalOverdue,
      availableCredit: Math.max(0, totalCreditExposure - totalOutstanding),
      retailersWithCredit,
      retailersOverdue,
      highExposureAccounts,
      averagePaymentConsistency,
      totalAccounts: credits.length,
    },
    accounts: paginatedAccounts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
    },
  }
}

/**
 * 7. DistroOS Command Center Operational Consolidation V1
 */
export const getCommandCenter = async (wholesalerId) => {
  const wholesalerObjId = new mongoose.Types.ObjectId(wholesalerId)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Execute pre-built intelligence services concurrently without code duplication
  const [
    execDashboard,
    reorderRes,
    inventoryRes,
    creditRes,
    todayOrdersAgg,
    recentOrders,
    recentCreditTxs,
  ] = await Promise.all([
    getExecutiveDashboardAnalytics(wholesalerId),
    getSmartReorderRecommendations(wholesalerId, { limit: 5 }),
    getInventoryIntelligence(wholesalerId, { limit: 5, sort: 'risk' }),
    getCreditIntelligence(wholesalerId, { limit: 5, sort: 'overdue' }),
    Order.aggregate([
      { $match: { wholesaler: wholesalerObjId, createdAt: { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          todayOrders: { $sum: 1 },
          todayRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0] },
          },
        },
      },
    ]),
    Order.find({ wholesaler: wholesalerObjId })
      .select('orderNumber totalAmount status createdAt retailer items')
      .populate('retailer', 'name businessName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Credit.aggregate([
      { $match: { wholesaler: wholesalerObjId } },
      { $unwind: '$transactions' },
      { $sort: { 'transactions.date': -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'retailer',
          foreignField: '_id',
          as: 'retailerObj',
        },
      },
      {
        $project: {
          transaction: '$transactions',
          retailerName: { $arrayElemAt: ['$retailerObj.businessName', 0] },
          contactName: { $arrayElemAt: ['$retailerObj.name', 0] },
        },
      },
    ]),
  ])

  // Process recent activity events from real database records
  const recentActivity = []

  recentOrders.forEach((o) => {
    recentActivity.push({
      id: `ord-${o._id}`,
      type: 'order',
      title: `Order #${o.orderNumber || o._id.toString().slice(-6)}`,
      subtitle: o.retailer?.businessName || o.retailer?.name || 'Retailer',
      amount: o.totalAmount || 0,
      status: o.status,
      date: o.createdAt,
    })
  })

  recentCreditTxs.forEach((t) => {
    if (t.transaction) {
      recentActivity.push({
        id: `tx-${t.transaction._id}`,
        type: t.transaction.type === 'credit' ? 'repayment' : 'credit_debit',
        title: t.transaction.type === 'credit' ? 'Payment Received' : 'Credit Balance Adjusted',
        subtitle: t.retailerName || t.contactName || 'Retailer',
        amount: t.transaction.amount || 0,
        note: t.transaction.note || '',
        date: t.transaction.date || new Date(),
      })
    }
  })

  recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Consolidate snapshot metrics
  const todayRev = todayOrdersAgg[0]?.todayRevenue || 0
  const todayOrds = todayOrdersAgg[0]?.todayOrders || 0

  const snapshot = {
    todayRevenue: todayRev,
    todayOrders: todayOrds,
    thirtyDayRevenue: execDashboard.kpis?.totalRevenue || 0,
    totalOutstandingCredit: creditRes.summary?.totalOutstanding || 0,
    activeRetailers: execDashboard.kpis?.activeRetailers || 0,
  }

  // Consolidate actionable attention metrics
  const reorderDueCount = (reorderRes.recommendations || []).filter((r) => r.status === 'REORDER_DUE').length

  const attention = {
    stockoutRiskCount: inventoryRes.summary?.stockoutRiskCount || 0,
    lowStockCount: inventoryRes.summary?.lowStockCount || 0,
    reorderDueCount,
    creditOverdueCount: creditRes.summary?.retailersOverdue || 0,
    totalOverdueAmount: creditRes.summary?.totalOverdue || 0,
    highExposureCount: creditRes.summary?.highExposureAccounts || 0,
    totalAttentionItems:
      (inventoryRes.summary?.stockoutRiskCount || 0) +
      (inventoryRes.summary?.lowStockCount || 0) +
      reorderDueCount +
      (creditRes.summary?.retailersOverdue || 0) +
      (creditRes.summary?.highExposureAccounts || 0),
  }

  return {
    attention,
    snapshot,
    smartReorder: (reorderRes.recommendations || []).slice(0, 5),
    inventoryAttention: (inventoryRes.products || []).slice(0, 5),
    creditAttention: (creditRes.accounts || []).slice(0, 5),
    salesTrend: execDashboard.monthlyTrends || execDashboard.revenueChart || [],
    recentActivity: recentActivity.slice(0, 7),
  }
}
