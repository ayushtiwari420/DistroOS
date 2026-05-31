import Order   from '../models/Order.model.js'
import Product from '../models/product.model.js'
import Credit  from '../models/Credit.model.js'

// ─────────────────────────────────────────────────────────────
// POST /api/orders
// Retailer or Salesman places an order
// ─────────────────────────────────────────────────────────────
export const createOrder = async (req, res, next) => {
  try {
    const { items, paymentType, notes, wholesalerId } = req.body
    const { id: requesterId, role } = req.user

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' })
    }

    // Determine retailer and wholesaler
    let retailerId     = requesterId
    let wholesalerIdFinal = role === 'retailer' ? req.user.wholesaler : wholesalerId
    if (role === 'salesman') {
      // Salesman places order on behalf of a retailer
      retailerId        = req.body.retailerId
      wholesalerIdFinal = req.body.wholesalerId
      if (!retailerId) return res.status(400).json({ success: false, message: 'retailerId is required for salesman orders.' })
    }

    // Validate products and calculate totals
    let totalAmount  = 0
    const orderItems = []

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, wholesaler: wholesalerIdFinal, isActive: true })
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found.` })
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` })
      }

      const totalPrice = product.price * item.quantity
      totalAmount     += totalPrice

      orderItems.push({
        product:     product._id,
        productName: product.name,
        quantity:    item.quantity,
        unitPrice:   product.price,
        totalPrice,
      })
    }

    // Create order
    const order = await Order.create({
      wholesaler:  wholesalerIdFinal,
      retailer:    retailerId,
      salesman:    role === 'salesman' ? requesterId : null,
      items:       orderItems,
      totalAmount,
      paymentType: paymentType || 'cash',
      notes,
    })

    await order.populate(['retailer', 'salesman'])

    return res.status(201).json({ success: true, message: 'Order placed successfully.', order })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/orders
// List orders — filtered by role automatically
// ─────────────────────────────────────────────────────────────
export const getOrders = async (req, res, next) => {
  try {
    const { id, role }  = req.user
    const { status, page = 1, limit = 20 } = req.query

    let filter = {}

    if (role === 'wholesaler') filter.wholesaler = id
    if (role === 'retailer')   filter.retailer   = id
    if (role === 'salesman')   filter.salesman    = id
    if (status)                filter.status      = status

    const skip   = (page - 1) * limit
    const orders = await Order.find(filter)
      .populate('retailer', 'name businessName phone')
      .populate('salesman', 'name')
      .populate('items.product', 'name unit')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await Order.countDocuments(filter)

    return res.status(200).json({
      success: true,
      orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/orders/:id
// ─────────────────────────────────────────────────────────────
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('retailer', 'name businessName phone city')
      .populate('salesman', 'name phone')
      .populate('wholesaler', 'name businessName')
      .populate('items.product', 'name unit category')

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' })

    // Access control
    const { id, role } = req.user
    const allowed =
      role === 'admin' ||
      order.wholesaler._id.toString() === id ||
      order.retailer._id.toString()   === id ||
      (order.salesman && order.salesman._id.toString() === id)

    if (!allowed) return res.status(403).json({ success: false, message: 'Access denied.' })

    return res.status(200).json({ success: true, order })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/orders/:id/status
// Wholesaler approves / rejects / dispatches
// ─────────────────────────────────────────────────────────────
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body
    const { id, role } = req.user

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' })

    // Only wholesaler or admin can change status
    if (role !== 'wholesaler' && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only wholesalers can update order status.' })
    }

    if (role === 'wholesaler' && order.wholesaler.toString() !== id) {
      return res.status(403).json({ success: false, message: 'Access denied.' })
    }

    const validTransitions = {
      pending:    ['approved', 'cancelled'],
      approved:   ['dispatched', 'cancelled'],
      dispatched: ['delivered'],
    }

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move order from ${order.status} to ${status}.`,
      })
    }

    // Update fields
    order.status = status
    if (status === 'approved')   order.approvedAt   = new Date()
    if (status === 'dispatched') {
      order.dispatchedAt = new Date()
      // Deduct stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      }
    }
    if (status === 'delivered')  order.deliveredAt  = new Date()
    if (status === 'cancelled')  {
      order.rejectionReason = rejectionReason || ''
      // If was dispatched, restore stock
      if (order.status === 'dispatched') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
        }
      }
    }

    await order.save()
    return res.status(200).json({ success: true, message: `Order ${status}.`, order })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/orders/stats
// Dashboard stats for wholesaler
// ─────────────────────────────────────────────────────────────
export const getOrderStats = async (req, res, next) => {
  try {
    const { id, role } = req.user
    const filter = role === 'wholesaler' ? { wholesaler: id } : {}

    const [total, pending, approved, dispatched, delivered, cancelled] = await Promise.all([
      Order.countDocuments(filter),
      Order.countDocuments({ ...filter, status: 'pending' }),
      Order.countDocuments({ ...filter, status: 'approved' }),
      Order.countDocuments({ ...filter, status: 'dispatched' }),
      Order.countDocuments({ ...filter, status: 'delivered' }),
      Order.countDocuments({ ...filter, status: 'cancelled' }),
    ])

    // Revenue — sum of delivered orders
    const revenueResult = await Order.aggregate([
      { $match: { ...filter, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ])
    const revenue = revenueResult[0]?.total || 0

    // This month's revenue
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const monthlyResult = await Order.aggregate([
      { $match: { ...filter, status: 'delivered', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ])
    const monthlyRevenue = monthlyResult[0]?.total || 0

    return res.status(200).json({
      success: true,
      stats: { total, pending, approved, dispatched, delivered, cancelled, revenue, monthlyRevenue },
    })
  } catch (err) {
    next(err)
  }
}