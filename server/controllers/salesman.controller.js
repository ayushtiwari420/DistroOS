import User  from '../models/User.model.js'
import Order from '../models/Order.model.js'

// ─────────────────────────────────────────────────────────────
// POST /api/salesmen
// Wholesaler adds a salesman
// ─────────────────────────────────────────────────────────────
export const createSalesman = async (req, res, next) => {
  try {
    const { name, email, phone, city, password, route } = req.body
    const wholesalerId = req.user.id

    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ success: false, message: 'A user with this email already exists.' })

    const salesman = await User.create({
      name, email,
      password:     password || 'Salesman@123',
      phone, city,
      businessName: route || '',   // reuse businessName field for route name
      role:         'salesman',
      wholesaler:   wholesalerId,
      status:       'active',
    })

    return res.status(201).json({ success: true, message: 'Salesman added successfully.', salesman })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/salesmen
// Wholesaler gets all their salesmen
// ─────────────────────────────────────────────────────────────
export const getSalesmen = async (req, res, next) => {
  try {
    const { id, role } = req.user
    const { search } = req.query

    const filter = { role: 'salesman' }
    if (role === 'wholesaler') filter.wholesaler = id
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]

    const salesmen = await User.find(filter).sort({ createdAt: -1 })

    // Attach order stats for each salesman
    const data = await Promise.all(salesmen.map(async (s) => {
      const totalOrders   = await Order.countDocuments({ salesman: s._id })
      const monthStart    = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const monthlyOrders = await Order.countDocuments({ salesman: s._id, createdAt: { $gte: monthStart } })
      const revenueResult = await Order.aggregate([
        { $match: { salesman: s._id, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ])
      return {
        ...s.toJSON(),
        stats: {
          totalOrders,
          monthlyOrders,
          revenue: revenueResult[0]?.total || 0,
        },
      }
    }))

    return res.status(200).json({ success: true, salesmen: data, total: data.length })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/salesmen/:id
// ─────────────────────────────────────────────────────────────
export const getSalesman = async (req, res, next) => {
  try {
    const salesman = await User.findOne({ _id: req.params.id, role: 'salesman' })
    if (!salesman) return res.status(404).json({ success: false, message: 'Salesman not found.' })

    const recentOrders = await Order.find({ salesman: salesman._id })
      .populate('retailer', 'name businessName')
      .sort({ createdAt: -1 }).limit(10)

    const revenueResult = await Order.aggregate([
      { $match: { salesman: salesman._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ])

    return res.status(200).json({
      success: true,
      salesman: {
        ...salesman.toJSON(),
        recentOrders,
        totalRevenue: revenueResult[0]?.total || 0,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/salesmen/:id
// ─────────────────────────────────────────────────────────────
export const updateSalesman = async (req, res, next) => {
  try {
    const salesman = await User.findOne({ _id: req.params.id, role: 'salesman', wholesaler: req.user.id })
    if (!salesman) return res.status(404).json({ success: false, message: 'Salesman not found.' })

    const fields = ['name', 'phone', 'city', 'status', 'businessName']
    fields.forEach(f => { if (req.body[f] !== undefined) salesman[f] = req.body[f] })
    await salesman.save()

    return res.status(200).json({ success: true, message: 'Salesman updated.', salesman })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/salesmen/:id
// ─────────────────────────────────────────────────────────────
export const deleteSalesman = async (req, res, next) => {
  try {
    const salesman = await User.findOne({ _id: req.params.id, role: 'salesman', wholesaler: req.user.id })
    if (!salesman) return res.status(404).json({ success: false, message: 'Salesman not found.' })

    salesman.status = 'suspended'
    await salesman.save()

    return res.status(200).json({ success: true, message: 'Salesman deactivated.' })
  } catch (err) {
    next(err)
  }
}