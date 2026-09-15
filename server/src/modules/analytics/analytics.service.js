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
 * 4. Inventory Health & Stockout Risk Analytics
 */
export const getInventoryAnalytics = async (wholesalerId) => {
  const wholesalerObjId = new mongoose.Types.ObjectId(wholesalerId)
  const products = await Product.find({ wholesaler: wholesalerId }).lean()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sales30Agg = await Order.aggregate([
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
      },
    },
  ])

  const sales30Map = {}
  sales30Agg.forEach((item) => {
    sales30Map[item._id.toString()] = item.unitsSold30Days
  })

  let lowStockCount = 0
  let outOfStockCount = 0
  let totalDeficitUnits = 0

  const inventoryHealth = products.map((p) => {
    const pIdStr = p._id.toString()
    const stock = p.stock || 0
    const lowStockAt = p.lowStockAt || 10
    const unitsSold = sales30Map[pIdStr] || 0
    const dailyVelocity = Number((unitsSold / 30).toFixed(2))

    if (stock === 0) outOfStockCount++
    else if (stock <= lowStockAt) lowStockCount++

    const deficit = Math.max(0, lowStockAt - stock)
    totalDeficitUnits += deficit

    const estimatedDaysToStockout = dailyVelocity > 0 ? Math.round(stock / dailyVelocity) : 999
    const reorderRecommended = deficit > 0 || estimatedDaysToStockout <= 7 || stock <= lowStockAt

    return {
      productId: p._id,
      productName: p.name,
      category: p.category || 'General',
      currentStock: stock,
      lowStockAt,
      stockDeficit: deficit,
      unitsSold30Days: unitsSold,
      dailyVelocity,
      estimatedDaysToStockout,
      reorderRecommended,
    }
  })

  inventoryHealth.sort((a, b) => a.estimatedDaysToStockout - b.estimatedDaysToStockout)

  return {
    summary: {
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      totalDeficitUnits,
    },
    inventoryHealth,
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
 * Smart Reorder Suggestions Generator
 */
export const getSmartReorderSuggestions = async (wholesalerId, retailerId = null) => {
  const queryFilter = { wholesaler: wholesalerId }
  if (retailerId) queryFilter.retailer = retailerId

  const orders = await Order.find(queryFilter)
    .populate('retailer', 'name businessName')
    .sort({ createdAt: 1 })
    .lean()

  const pairMap = {}

  orders.forEach((o) => {
    const rId = o.retailer?._id?.toString() || 'unknown'
    const rName = o.retailer?.businessName || o.retailer?.name || 'Retailer'

    o.items.forEach((item) => {
      const pId = item.product?.toString() || item.productName
      const key = `${rId}_${pId}`

      if (!pairMap[key]) {
        pairMap[key] = {
          retailerId: rId,
          retailerName: rName,
          productId: pId,
          productName: item.productName,
          orderDates: [],
          quantities: [],
        }
      }
      pairMap[key].orderDates.push(new Date(o.createdAt).getTime())
      pairMap[key].quantities.push(item.quantity)
    })
  })

  const now = Date.now()
  const suggestions = []

  Object.values(pairMap).forEach((pair) => {
    const totalOrders = pair.orderDates.length
    const lastOrderTime = pair.orderDates[pair.orderDates.length - 1]
    const avgQuantity = Math.round(
      pair.quantities.reduce((a, b) => a + b, 0) / pair.quantities.length
    )

    let avgIntervalDays = 7
    if (totalOrders > 1) {
      const intervals = []
      for (let i = 1; i < totalOrders; i++) {
        intervals.push((pair.orderDates[i] - pair.orderDates[i - 1]) / (1000 * 60 * 60 * 24))
      }
      avgIntervalDays = Math.max(1, Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length))
    }

    const expectedTime = lastOrderTime + avgIntervalDays * 24 * 60 * 60 * 1000
    const daysUntilReorder = Math.round((expectedTime - now) / (1000 * 60 * 60 * 24))

    let status = 'on_track'
    if (daysUntilReorder < 0) {
      status = 'overdue_reorder'
    } else if (daysUntilReorder <= 5) {
      status = 'reorder_due_soon'
    }

    suggestions.push({
      retailerId: pair.retailerId,
      retailerName: pair.retailerName,
      productId: pair.productId,
      productName: pair.productName,
      totalOrdersCount: totalOrders,
      lastOrderDate: new Date(lastOrderTime),
      averageQuantity: avgQuantity,
      averageIntervalDays: avgIntervalDays,
      expectedReorderDate: new Date(expectedTime),
      daysUntilReorder,
      status,
      suggestedQuantity: avgQuantity,
    })
  })

  return suggestions.sort((a, b) => a.daysUntilReorder - b.daysUntilReorder)
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
