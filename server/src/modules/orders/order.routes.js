import express from 'express'
import {
  createOrder, getOrders, getOrder, updateOrderStatus, getOrderStats,
} from './order.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validateCreateOrder } from '../../middleware/validate.middleware.js'

const router = express.Router()

router.use(protect)

router.get('/stats',       getOrderStats)
router.get('/',            getOrders)
router.get('/:id',         getOrder)
router.post('/',           validateCreateOrder, createOrder)
router.patch('/:id/status', updateOrderStatus)

export default router
