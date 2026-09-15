import mongoose from 'mongoose'
import User from '../users/user.model.js'
import Order from '../orders/order.model.js'
import { ApiError, StatusCode } from '../../utils/apiError.utils.js'

export const createSalesman = async (wholesalerId, body) => {
  const { name, email, phone, city, password, route } = body

  if (!password || String(password).trim().length < 8) {
    throw new ApiError(StatusCode.BAD_REQUEST, 'Password is required and must be at least 8 characters.')
  }

  const existing = await User.findOne({ email })
  if (existing) throw new ApiError(StatusCode.CONFLICT, 'A user with this email already exists.')

  const salesman = await User.create({
    name, email,
    password,
    phone, city,
    businessName: route || '',
    role:         'salesman',
    wholesaler:   wholesalerId,
    status:       'active',
  })

  return salesman
}

export const getSalesmen = async (user, query) => {
  const { id, role } = user
  const { search } = query

  const filter = { role: 'salesman' }
  if (role === 'wholesaler') filter.wholesaler = id
  if (search) filter.$or = [
    { name:  { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ]

  const salesmen = await User.find(filter).sort({ createdAt: -1 })
  if (salesmen.length === 0) return { salesmen: [], total: 0 }

  const salesmanIds = salesmen.map(s => s._id)
  const monthStart  = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const statsAggregation = await Order.aggregate([
    { $match: { salesman: { $in: salesmanIds } } },
    {
      $group: {
        _id: '$salesman',
        totalOrders: { $sum: 1 },
        monthlyOrders: {
          $sum: { $cond: [{ $gte: ['$createdAt', monthStart] }, 1, 0] }
        },
        revenue: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0] }
        }
      }
    }
  ])

  const statsMap = {}
  statsAggregation.forEach(stat => {
    if (stat._id) {
      statsMap[stat._id.toString()] = {
        totalOrders: stat.totalOrders,
        monthlyOrders: stat.monthlyOrders,
        revenue: stat.revenue,
      }
    }
  })

  const data = salesmen.map(s => {
    const sId = s._id.toString()
    const stat = statsMap[sId] || { totalOrders: 0, monthlyOrders: 0, revenue: 0 }
    return {
      ...s.toJSON(),
      stats: stat,
    }
  })

  return { salesmen: data, total: data.length }
}

export const getSalesmanById = async (salesmanId, wholesalerId) => {
  const filter = { _id: salesmanId, role: 'salesman' }
  if (wholesalerId) filter.wholesaler = wholesalerId

  const salesman = await User.findOne(filter)
  if (!salesman) throw new ApiError(StatusCode.NOT_FOUND, 'Salesman not found in your network.')

  const orderFilter = { salesman: salesman._id }
  if (wholesalerId) orderFilter.wholesaler = wholesalerId

  const recentOrders = await Order.find(orderFilter)
    .populate('retailer', 'name businessName')
    .sort({ createdAt: -1 }).limit(10)

  const matchStage = { salesman: salesman._id, status: 'delivered' }
  if (wholesalerId) matchStage.wholesaler = new mongoose.Types.ObjectId(wholesalerId)

  const revenueResult = await Order.aggregate([
    { $match: matchStage },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ])

  return {
    ...salesman.toJSON(),
    recentOrders,
    totalRevenue: revenueResult[0]?.total || 0,
  }
}

export const updateSalesman = async (salesmanId, wholesalerId, body) => {
  const salesman = await User.findOne({ _id: salesmanId, role: 'salesman', wholesaler: wholesalerId })
  if (!salesman) throw new ApiError(StatusCode.NOT_FOUND, 'Salesman not found.')

  const fields = ['name', 'phone', 'city', 'status', 'businessName']
  fields.forEach(f => { if (body[f] !== undefined) salesman[f] = body[f] })
  await salesman.save()

  return salesman
}

export const deleteSalesman = async (salesmanId, wholesalerId) => {
  const salesman = await User.findOne({ _id: salesmanId, role: 'salesman', wholesaler: wholesalerId })
  if (!salesman) throw new ApiError(StatusCode.NOT_FOUND, 'Salesman not found.')

  salesman.status = 'suspended'
  await salesman.save()

  return { success: true }
}
