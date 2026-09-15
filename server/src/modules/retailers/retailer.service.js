import User from '../users/user.model.js'
import Credit from '../credit/credit.model.js'
import Order from '../orders/order.model.js'
import { ApiError, StatusCode } from '../../utils/apiError.utils.js'

export const linkRetailer = async (wholesalerId, email, creditLimit) => {
  const retailer = await User.findOne({ email, role: 'retailer' })
  if (!retailer) {
    throw new ApiError(StatusCode.NOT_FOUND, 'No retailer account found with this email. Ask them to register first.')
  }

  if (retailer.wholesaler?.toString() === wholesalerId) {
    throw new ApiError(StatusCode.CONFLICT, 'This retailer is already linked to your account.')
  }

  if (retailer.wholesaler && retailer.wholesaler.toString() !== wholesalerId) {
    throw new ApiError(StatusCode.CONFLICT, 'This retailer is already linked to another wholesaler.')
  }

  retailer.wholesaler = wholesalerId
  retailer.status     = 'active'
  await retailer.save({ validateBeforeSave: false })

  const existingCredit = await Credit.findOne({ retailer: retailer._id, wholesaler: wholesalerId })
  if (!existingCredit) {
    await Credit.create({
      wholesaler:  wholesalerId,
      retailer:    retailer._id,
      creditLimit: creditLimit || 0,
    })
  }

  return retailer
}

export const searchRetailer = async (wholesalerId, email) => {
  const retailer = await User.findOne({ email, role: 'retailer' })
  if (!retailer) {
    throw new ApiError(StatusCode.NOT_FOUND, 'No retailer found with this email.')
  }

  const alreadyLinked = retailer.wholesaler?.toString() === wholesalerId

  return {
    retailer: {
      _id:          retailer._id,
      name:         retailer.name,
      email:        retailer.email,
      phone:        retailer.phone,
      businessName: retailer.businessName,
      city:         retailer.city,
      status:       retailer.status,
    },
    alreadyLinked,
  }
}

export const createRetailer = async (wholesalerId, body) => {
  const { name, email, phone, businessName, city, password, creditLimit } = body

  if (!password || String(password).trim().length < 8) {
    throw new ApiError(StatusCode.BAD_REQUEST, 'Password is required and must be at least 8 characters.')
  }

  const existing = await User.findOne({ email })
  if (existing) {
    throw new ApiError(StatusCode.CONFLICT, 'An account with this email already exists. Use "Link Retailer" instead to connect them.')
  }

  const retailer = await User.create({
    name,
    email,
    password,
    phone,
    businessName,
    city,
    role:       'retailer',
    wholesaler: wholesalerId,
    status:     'active',
  })

  await Credit.create({
    wholesaler:  wholesalerId,
    retailer:    retailer._id,
    creditLimit: creditLimit || 0,
  })

  return retailer
}

export const getRetailers = async (user, query) => {
  const { id, role } = user
  const { search, status } = query

  const filter = { role: 'retailer' }
  if (role === 'wholesaler') filter.wholesaler = id
  if (status) filter.status = status
  if (search) filter.$or = [
    { name:         { $regex: search, $options: 'i' } },
    { businessName: { $regex: search, $options: 'i' } },
    { city:         { $regex: search, $options: 'i' } },
  ]

  const retailers   = await User.find(filter).sort({ createdAt: -1 })
  const retailerIds = retailers.map(r => r._id)
  const credits     = await Credit.find({ retailer: { $in: retailerIds }, wholesaler: id })
  const creditMap   = {}
  credits.forEach(c => { creditMap[c.retailer.toString()] = c })

  const data = retailers.map(r => ({
    ...r.toJSON(),
    credit: creditMap[r._id.toString()] || null,
  }))

  return { retailers: data, total: data.length }
}

export const getRetailerById = async (retailerId, wholesalerId) => {
  const filter = { _id: retailerId, role: 'retailer' }
  if (wholesalerId) filter.wholesaler = wholesalerId

  const retailer = await User.findOne(filter)
  if (!retailer) throw new ApiError(StatusCode.NOT_FOUND, 'Retailer not found in your network.')

  const creditFilter = { retailer: retailer._id }
  if (wholesalerId) creditFilter.wholesaler = wholesalerId

  const credit       = await Credit.findOne(creditFilter)
  const orderFilter  = { retailer: retailer._id }
  if (wholesalerId) orderFilter.wholesaler = wholesalerId

  const recentOrders = await Order.find(orderFilter).sort({ createdAt: -1 }).limit(5)

  return { ...retailer.toJSON(), credit, recentOrders }
}

export const updateRetailer = async (retailerId, wholesalerId, body) => {
  const retailer = await User.findOne({ _id: retailerId, role: 'retailer', wholesaler: wholesalerId })
  if (!retailer) throw new ApiError(StatusCode.NOT_FOUND, 'Retailer not found.')

  const fields = ['name', 'phone', 'businessName', 'city', 'status']
  fields.forEach(f => { if (body[f] !== undefined) retailer[f] = body[f] })
  await retailer.save({ validateBeforeSave: false })

  if (body.creditLimit !== undefined) {
    await Credit.findOneAndUpdate(
      { retailer: retailer._id, wholesaler: wholesalerId },
      { creditLimit: body.creditLimit },
      { upsert: true }
    )
  }

  return retailer
}

export const deleteRetailer = async (retailerId, wholesalerId) => {
  const retailer = await User.findOne({ _id: retailerId, role: 'retailer', wholesaler: wholesalerId })
  if (!retailer) throw new ApiError(StatusCode.NOT_FOUND, 'Retailer not found.')

  retailer.wholesaler = null
  retailer.status     = 'pending'
  await retailer.save({ validateBeforeSave: false })

  return { success: true }
}
