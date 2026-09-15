import mongoose from 'mongoose'
import Order from './order.model.js'
import Product from '../products/product.model.js'
import Credit from '../credit/credit.model.js'
import User from '../users/user.model.js'
import { ApiError, StatusCode } from '../../utils/apiError.utils.js'
import { logAuditEvent } from '../audit/audit.service.js'

export const createOrder = async (user, body) => {
  const { items, paymentType, notes } = body
  const { id: requesterId, role } = user

  if (!items || items.length === 0) {
    throw new ApiError(StatusCode.BAD_REQUEST, 'Order must have at least one item.')
  }

  const normalizedPaymentType = ['cash', 'credit', 'upi'].includes(paymentType) ? paymentType : 'cash'

  let retailerId        = role === 'retailer' ? requesterId : body.retailerId
  let wholesalerIdFinal = role === 'wholesaler' ? requesterId : user.wholesaler

  if (role === 'salesman' && !retailerId) {
    throw new ApiError(StatusCode.BAD_REQUEST, 'retailerId is required for salesman orders.')
  }

  if (role === 'wholesaler' && !retailerId) {
    throw new ApiError(StatusCode.BAD_REQUEST, 'retailerId is required for wholesaler-created orders.')
  }

  if (!wholesalerIdFinal) {
    throw new ApiError(StatusCode.FORBIDDEN, 'Retailer is not linked to a wholesaler yet.')
  }

  const retailer = await User.findOne({
    _id: retailerId,
    role: 'retailer',
    wholesaler: wholesalerIdFinal,
    status: 'active',
  }).select('_id')

  if (!retailer) {
    throw new ApiError(StatusCode.FORBIDDEN, 'Retailer is not linked to this wholesaler.')
  }

  let totalAmount  = 0
  const orderItems = []

  for (const item of items) {
    const quantity = Number(item.quantity)
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new ApiError(StatusCode.BAD_REQUEST, 'Each order item must have a valid quantity.')
    }

    const product = await Product.findOne({ _id: item.productId, wholesaler: wholesalerIdFinal, isActive: true })
    if (!product) {
      throw new ApiError(StatusCode.NOT_FOUND, `Product ${item.productId} not found.`)
    }
    if (product.stock < quantity) {
      throw new ApiError(StatusCode.BAD_REQUEST, `Insufficient stock for ${product.name}. Available: ${product.stock}`)
    }

    const totalPrice = product.price * quantity
    totalAmount     += totalPrice

    orderItems.push({
      product:     product._id,
      productName: product.name,
      quantity,
      unitPrice:   product.price,
      totalPrice,
    })
  }

  let creditAccount = null
  if (normalizedPaymentType === 'credit') {
    creditAccount = await Credit.findOne({ retailer: retailerId, wholesaler: wholesalerIdFinal })
    if (!creditAccount) {
      throw new ApiError(StatusCode.BAD_REQUEST, 'Credit account not found for this retailer.')
    }
    if (creditAccount.status === 'blocked') {
      throw new ApiError(StatusCode.BAD_REQUEST, 'This retailer credit account is blocked.')
    }

    const newDue = creditAccount.currentDue + totalAmount
    if (creditAccount.creditLimit > 0 && newDue > creditAccount.creditLimit) {
      throw new ApiError(
        StatusCode.BAD_REQUEST,
        `Credit limit exceeded. Limit: ₹${creditAccount.creditLimit}, Current due: ₹${creditAccount.currentDue}`
      )
    }
  }

  const order = await Order.create({
    wholesaler:    wholesalerIdFinal,
    retailer:      retailerId,
    salesman:      role === 'salesman' ? requesterId : null,
    items:         orderItems,
    totalAmount,
    paymentType:   normalizedPaymentType,
    paymentStatus: normalizedPaymentType === 'credit' ? 'unpaid' : 'paid',
    notes,
  })

  if (creditAccount) {
    creditAccount.currentDue += totalAmount
    creditAccount.status = creditAccount.currentDue > 0 ? 'overdue' : 'clear'
    creditAccount.transactions.push({
      type: 'debit',
      amount: totalAmount,
      runningBalance: creditAccount.currentDue,
      note: `Order ${order.orderNumber}`,
      order: order._id,
    })
    await creditAccount.save()
  }

  logAuditEvent({
    user: requesterId,
    wholesaler: wholesalerIdFinal,
    action: 'ORDER_PLACED',
    resource: 'Order',
    resourceId: order._id,
    details: { orderNumber: order.orderNumber, totalAmount, paymentType: normalizedPaymentType },
  })

  await order.populate(['retailer', 'salesman'])
  return order
}

export const getOrders = async (user, query) => {
  const { id, role } = user
  const { status, page = 1, limit = 20 } = query

  const filter = {}
  if (role === 'wholesaler') filter.wholesaler = id
  if (role === 'retailer')   filter.retailer   = id
  if (role === 'salesman')   filter.salesman   = id
  if (status)                filter.status     = status

  const skip   = (page - 1) * limit
  const orders = await Order.find(filter)
    .populate('retailer', 'name businessName phone')
    .populate('salesman', 'name')
    .populate('items.product', 'name unit')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))

  const total = await Order.countDocuments(filter)

  return {
    orders,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  }
}

export const getOrderById = async (orderId, user) => {
  const order = await Order.findById(orderId)
    .populate('retailer', 'name businessName phone city')
    .populate('salesman', 'name phone')
    .populate('wholesaler', 'name businessName')
    .populate('items.product', 'name unit category')

  if (!order) throw new ApiError(StatusCode.NOT_FOUND, 'Order not found.')

  const { id, role } = user
  const allowed =
    role === 'admin' ||
    order.wholesaler._id.toString() === id ||
    order.retailer._id.toString()   === id ||
    (order.salesman && order.salesman._id.toString() === id)

  if (!allowed) throw new ApiError(StatusCode.FORBIDDEN, 'Access denied.')

  return order
}

export const updateOrderStatus = async (orderId, user, status, rejectionReason) => {
  const { id, role } = user

  const order = await Order.findById(orderId)
  if (!order) throw new ApiError(StatusCode.NOT_FOUND, 'Order not found.')

  if (role !== 'wholesaler' && role !== 'admin') {
    throw new ApiError(StatusCode.FORBIDDEN, 'Only wholesalers can update order status.')
  }

  if (role === 'wholesaler' && order.wholesaler.toString() !== id) {
    throw new ApiError(StatusCode.FORBIDDEN, 'Access denied.')
  }

  const validTransitions = {
    pending:    ['approved', 'cancelled'],
    approved:   ['dispatched', 'cancelled'],
    dispatched: ['delivered'],
  }

  const previousStatus = order.status
  if (!validTransitions[previousStatus]?.includes(status)) {
    throw new ApiError(StatusCode.BAD_REQUEST, `Cannot move order from ${previousStatus} to ${status}.`)
  }

  order.status = status
  if (status === 'approved')   order.approvedAt   = new Date()
  if (status === 'dispatched') {
    for (const item of order.items) {
      const currentProd = await Product.findById(item.product).select('name stock')
      if (!currentProd || currentProd.stock < item.quantity) {
        throw new ApiError(
          StatusCode.BAD_REQUEST,
          `Stock reservation failed for "${item.productName}". Available: ${currentProd?.stock || 0}, Requested: ${item.quantity}.`
        )
      }
    }

    order.dispatchedAt = new Date()
    for (const item of order.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      )
      if (!updatedProduct) {
        throw new ApiError(
          StatusCode.BAD_REQUEST,
          `Stock reservation failed for "${item.productName}". Available stock is less than requested quantity (${item.quantity}).`
        )
      }
    }
  }
  if (status === 'delivered')  order.deliveredAt  = new Date()
  if (status === 'cancelled')  {
    order.rejectionReason = rejectionReason || ''
    if (previousStatus === 'dispatched') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
      }
    }
    if (order.paymentType === 'credit' && order.paymentStatus === 'unpaid') {
      const creditAccount = await Credit.findOne({ retailer: order.retailer, wholesaler: order.wholesaler })
      if (creditAccount) {
        creditAccount.currentDue = Math.max(0, creditAccount.currentDue - order.totalAmount)
        creditAccount.status = creditAccount.currentDue > 0 ? 'overdue' : 'clear'
        creditAccount.transactions.push({
          type: 'credit',
          amount: order.totalAmount,
          runningBalance: creditAccount.currentDue,
          note: `Cancelled order ${order.orderNumber}`,
          order: order._id,
        })
        await creditAccount.save()
      }
    }
  }

  await order.save()

  logAuditEvent({
    user: id,
    wholesaler: order.wholesaler,
    action: 'ORDER_STATUS_UPDATED',
    resource: 'Order',
    resourceId: order._id,
    details: { orderNumber: order.orderNumber, previousStatus, newStatus: status },
  })

  return order
}

export const getOrderStats = async (user) => {
  const { id, role } = user
  const filter = {}
  if (role === 'wholesaler') filter.wholesaler = id
  else if (role === 'retailer') filter.retailer = id
  else if (role === 'salesman') filter.salesman = id

  const [total, pending, approved, dispatched, delivered, cancelled] = await Promise.all([
    Order.countDocuments(filter),
    Order.countDocuments({ ...filter, status: 'pending' }),
    Order.countDocuments({ ...filter, status: 'approved' }),
    Order.countDocuments({ ...filter, status: 'dispatched' }),
    Order.countDocuments({ ...filter, status: 'delivered' }),
    Order.countDocuments({ ...filter, status: 'cancelled' }),
  ])

  const aggregateMatch = { ...filter, status: 'delivered' }
  if (filter.wholesaler) aggregateMatch.wholesaler = new mongoose.Types.ObjectId(filter.wholesaler)
  if (filter.retailer)   aggregateMatch.retailer   = new mongoose.Types.ObjectId(filter.retailer)
  if (filter.salesman)   aggregateMatch.salesman   = new mongoose.Types.ObjectId(filter.salesman)

  const revenueResult = await Order.aggregate([
    { $match: aggregateMatch },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ])
  const revenue = revenueResult[0]?.total || 0

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const monthlyResult = await Order.aggregate([
    { $match: { ...aggregateMatch, createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ])
  const monthlyRevenue = monthlyResult[0]?.total || 0

  return { total, pending, approved, dispatched, delivered, cancelled, revenue, monthlyRevenue }
}
