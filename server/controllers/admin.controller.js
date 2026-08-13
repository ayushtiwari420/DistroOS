import User  from '../models/User.model.js'
import Order from '../models/Order.model.js'
import { ApiError, StatusCode } from '../utils/apiError.utils.js'

// ─────────────────────────────────────────────────────────────
// GET /api/admin/wholesalers
// ─────────────────────────────────────────────────────────────
export const getWholesalers = async (req, res, next) => {
  try {
    const { status, search } = req.query
    const filter = { role: 'wholesaler' }
    if (status) filter.status = status
    if (search) filter.$or = [
      { name:         { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } },
    ]

    const wholesalers = await User.find(filter).sort({ createdAt: -1 })

    // Attach counts
    const data = await Promise.all(wholesalers.map(async w => {
      const [retailers, salesmen, orders] = await Promise.all([
        User.countDocuments({ role: 'retailer',  wholesaler: w._id }),
        User.countDocuments({ role: 'salesman',  wholesaler: w._id }),
        Order.countDocuments({ wholesaler: w._id }),
      ])
      return { ...w.toJSON(), counts: { retailers, salesmen, orders } }
    }))

    return res.status(200).json({ success: true, wholesalers: data, total: data.length })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/wholesalers/:id/status
// Approve / suspend a wholesaler
// ─────────────────────────────────────────────────────────────
export const updateWholesalerStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['active', 'suspended', 'pending'].includes(status)) {
      throw new ApiError(StatusCode.BAD_REQUEST, 'Invalid status.')
    }

    const wholesaler = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'wholesaler' },
      { status },
      { new: true }
    )
    if (!wholesaler) throw new ApiError(StatusCode.NOT_FOUND, 'Wholesaler not found.')

    return res.status(200).json({ success: true, message: `Wholesaler ${status}.`, wholesaler })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats
// Platform-wide stats
// ─────────────────────────────────────────────────────────────
export const getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalWholesalers,
      activeWholesalers,
      pendingWholesalers,
      totalRetailers,
      totalSalesmen,
      totalOrders,
      pendingOrders,
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

    // Monthly orders for last 6 months
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

    return res.status(200).json({
      success: true,
      stats: {
        totalWholesalers, activeWholesalers, pendingWholesalers,
        totalRetailers, totalSalesmen,
        totalOrders, pendingOrders,
        totalRevenue: revenueResult[0]?.total || 0,
        monthlyOrders,
      },
    })
  } catch (err) {
    next(err)
  }
}
