import { Router }   from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { createOrder, getOrders, getOrder, updateOrderStatus, getOrderStats } from '../controllers/order.controller.js'

const router = Router()
router.use(protect)

router.get('/stats',        authorize('wholesaler', 'admin'), getOrderStats)
router.post('/',            authorize('retailer', 'salesman', 'wholesaler'), createOrder)
router.get('/',             getOrders)
router.get('/:id',          getOrder)
router.patch('/:id/status', authorize('wholesaler', 'admin'), updateOrderStatus)

export default router