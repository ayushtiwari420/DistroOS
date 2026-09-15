import User from '../users/user.model.js'
import Order from '../orders/order.model.js'
import { ApiError, StatusCode } from '../../utils/apiError.utils.js'

export const getWholesalers = async (query) => {
  const { status, search } = query
  const filter = { role: 'wholesaler' }
  if (status) filter.status = status
  if (search) filter.$or = [
    { name:         { $regex: search, $options: 'i' } },
    { businessName: { $regex: search, $options: 'i' } },
  ]

  const wholesalers = await User.find(filter).sort({ createdAt: -1 })
  if (wholesalers.length === 0) return { wholesalers: [], total: 0 }

  const wholesalerIds = wholesalers.map(w => w._id)

  const [userCounts, orderCounts] = await Promise.all([
    User.aggregate([
      { $match: { wholesaler: { $in: wholesalerIds }, role: { $in: ['retailer', 'salesman'] } } },
      {
        $group: {
          _id: { wholesaler: '$wholesaler', role: '$role' },
          count: { $sum: 1 },
        }
      }
    ]),
    Order.aggregate([
      { $match: { wholesaler: { $in: wholesalerIds } } },
      {
        $group: {
          _id: '$wholesaler',
          count: { $sum: 1 },
        }
      }
    ])
  ])

  const userCountMap = {}
  userCounts.forEach(uc => {
    if (uc._id?.wholesaler) {
      const wId = uc._id.wholesaler.toString()
      if (!userCountMap[wId]) userCountMap[wId] = { retailers: 0, salesmen: 0 }
      if (uc._id.role === 'retailer') userCountMap[wId].retailers = uc.count
      if (uc._id.role === 'salesman') userCountMap[wId].salesmen = uc.count
    }
  })

  const orderCountMap = {}
  orderCounts.forEach(oc => {
    if (oc._id) orderCountMap[oc._id.toString()] = oc.count
  })

  const data = wholesalers.map(w => {
    const wId = w._id.toString()
    const uCounts = userCountMap[wId] || { retailers: 0, salesmen: 0 }
    const oCount  = orderCountMap[wId] || 0
    return {
      ...w.toJSON(),
      counts: {
        retailers: uCounts.retailers,
        salesmen:  uCounts.salesmen,
        orders:    oCount,
      }
    }
  })

  return { wholesalers: data, total: data.length }
}

export const updateWholesalerStatus = async (wholesalerId, status) => {
  if (!['active', 'suspended', 'pending'].includes(status)) {
    throw new ApiError(StatusCode.BAD_REQUEST, 'Invalid status.')
  }

  const wholesaler = await User.findOneAndUpdate(
    { _id: wholesalerId, role: 'wholesaler' },
    { status },
    { new: true }
  )
  if (!wholesaler) throw new ApiError(StatusCode.NOT_FOUND, 'Wholesaler not found.')
  return wholesaler
}

export const getPlatformStats = async () => {
  const [
    totalWholesalers, activeWholesalers, pendingWholesalers,
    totalRetailers, totalSalesmen, totalOrders, pendingOrders,
  ] = await Promise.all([
    User.countDocuments({ role: 'wholesaler' }),
    User.countDocuments({ role: 'wholesaler', status: 'active' }),
    User.countDocuments({ role: 'wholesaler', status: 'pending' }),
    User.countDocuments({ role: 'retailer' }),
    User.countDocuments({ role: 'salesman' }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
  ])

  const revenueResult = await Order.aggregate([
    { $match: { status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ])

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const monthlyOrders = await Order.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: {
      _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
      count:   { $sum: 1 },
      revenue: { $sum: '$totalAmount' },
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])

  return {
    totalWholesalers, activeWholesalers, pendingWholesalers,
    totalRetailers, totalSalesmen,
    totalOrders, pendingOrders,
    totalRevenue: revenueResult[0]?.total || 0,
    monthlyOrders,
  }
}
