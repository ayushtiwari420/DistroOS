import User   from '../models/User.model.js'
import Credit from '../models/Credit.model.js'
import Order  from '../models/Order.model.js'
import { ApiError, StatusCode } from '../utils/apiError.utils.js'

// ─────────────────────────────────────────────────────────────
// POST /api/retailers/link
// Wholesaler links an EXISTING retailer account to themselves
// ─────────────────────────────────────────────────────────────
export const linkRetailer = async (req, res, next) => {
  try {
    const { email, creditLimit } = req.body
    const wholesalerId = req.user.id

    // Find the retailer by email
    const retailer = await User.findOne({ email, role: 'retailer' })
    if (!retailer) {
      throw new ApiError(StatusCode.NOT_FOUND, 'No retailer account found with this email. Ask them to register first.')
    }

    // Check if already linked to THIS wholesaler
    if (retailer.wholesaler?.toString() === wholesalerId) {
      throw new ApiError(StatusCode.CONFLICT, 'This retailer is already linked to your account.')
    }

    // Check if linked to a DIFFERENT wholesaler
    if (retailer.wholesaler && retailer.wholesaler.toString() !== wholesalerId) {
      throw new ApiError(StatusCode.CONFLICT, 'This retailer is already linked to another wholesaler.')
    }

    // Link retailer to this wholesaler
    retailer.wholesaler = wholesalerId
    retailer.status     = 'active'
    await retailer.save({ validateBeforeSave: false })

    // Create credit record if not exists
    const existingCredit = await Credit.findOne({ retailer: retailer._id, wholesaler: wholesalerId })
    if (!existingCredit) {
      await Credit.create({
        wholesaler:  wholesalerId,
        retailer:    retailer._id,
        creditLimit: creditLimit || 0,
      })
    }

    return res.status(200).json({
      success: true,
      message: `${retailer.name} has been linked to your account.`,
      retailer,
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/retailers/search
// Wholesaler searches for a retailer by email before linking
// ─────────────────────────────────────────────────────────────
export const searchRetailer = async (req, res, next) => {
  try {
    const { email } = req.body
    const wholesalerId = req.user.id

    const retailer = await User.findOne({ email, role: 'retailer' })
    if (!retailer) {
      throw new ApiError(StatusCode.NOT_FOUND, 'No retailer found with this email.')
    }

    // Check link status
    const alreadyLinked = retailer.wholesaler?.toString() === wholesalerId

    return res.status(200).json({
      success: true,
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
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/retailers
// Wholesaler creates a BRAND NEW retailer account (no existing account)
// ─────────────────────────────────────────────────────────────
export const createRetailer = async (req, res, next) => {
  try {
    const { name, email, phone, businessName, city, password, creditLimit } = req.body
    const wholesalerId = req.user.id

    const existing = await User.findOne({ email })
    if (existing) {
      throw new ApiError(StatusCode.CONFLICT, 'An account with this email already exists. Use "Link Retailer" instead to connect them.')
    }

    const retailer = await User.create({
      name,
      email,
      password:   password || 'Retailer@123',
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

    return res.status(201).json({
      success: true,
      message: 'Retailer account created and linked.',
      retailer,
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/retailers
// ─────────────────────────────────────────────────────────────
export const getRetailers = async (req, res, next) => {
  try {
    const { id, role } = req.user
    const { search, status } = req.query

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

    return res.status(200).json({ success: true, retailers: data, total: data.length })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/retailers/:id
// ─────────────────────────────────────────────────────────────
export const getRetailer = async (req, res, next) => {
  try {
    const retailer = await User.findOne({ _id: req.params.id, role: 'retailer' })
    if (!retailer) throw new ApiError(StatusCode.NOT_FOUND, 'Retailer not found.')

    const credit       = await Credit.findOne({ retailer: retailer._id })
    const recentOrders = await Order.find({ retailer: retailer._id }).sort({ createdAt: -1 }).limit(5)

    return res.status(200).json({
      success: true,
      retailer: { ...retailer.toJSON(), credit, recentOrders },
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/retailers/:id
// ─────────────────────────────────────────────────────────────
export const updateRetailer = async (req, res, next) => {
  try {
    const retailer = await User.findOne({ _id: req.params.id, role: 'retailer', wholesaler: req.user.id })
    if (!retailer) throw new ApiError(StatusCode.NOT_FOUND, 'Retailer not found.')

    const fields = ['name', 'phone', 'businessName', 'city', 'status']
    fields.forEach(f => { if (req.body[f] !== undefined) retailer[f] = req.body[f] })
    await retailer.save({ validateBeforeSave: false })

    if (req.body.creditLimit !== undefined) {
      await Credit.findOneAndUpdate(
        { retailer: retailer._id, wholesaler: req.user.id },
        { creditLimit: req.body.creditLimit },
        { upsert: true }
      )
    }

    return res.status(200).json({ success: true, message: 'Retailer updated.', retailer })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/retailers/:id  (unlink — soft)
// ─────────────────────────────────────────────────────────────
export const deleteRetailer = async (req, res, next) => {
  try {
    const retailer = await User.findOne({ _id: req.params.id, role: 'retailer', wholesaler: req.user.id })
    if (!retailer) throw new ApiError(StatusCode.NOT_FOUND, 'Retailer not found.')

    // Unlink instead of delete — retailer account still exists
    retailer.wholesaler = null
    retailer.status     = 'pending'
    await retailer.save({ validateBeforeSave: false })

    return res.status(200).json({ success: true, message: 'Retailer unlinked from your account.' })
  } catch (err) {
    next(err)
  }
}