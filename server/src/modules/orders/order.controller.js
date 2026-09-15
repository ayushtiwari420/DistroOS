import * as orderService from './order.service.js'

export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user, req.body)
    return res.status(201).json({ success: true, message: 'Order placed successfully.', order })
  } catch (err) { next(err) }
}

export const getOrders = async (req, res, next) => {
  try {
    const result = await orderService.getOrders(req.user, req.query)
    return res.status(200).json({ success: true, ...result })
  } catch (err) { next(err) }
}

export const getOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user)
    return res.status(200).json({ success: true, order })
  } catch (err) { next(err) }
}

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body
    const order = await orderService.updateOrderStatus(req.params.id, req.user, status, rejectionReason)
    return res.status(200).json({ success: true, message: `Order ${status}.`, order })
  } catch (err) { next(err) }
}

export const getOrderStats = async (req, res, next) => {
  try {
    const stats = await orderService.getOrderStats(req.user)
    return res.status(200).json({ success: true, stats })
  } catch (err) { next(err) }
}
