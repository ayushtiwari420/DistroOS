import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import {
  createRetailer,
  linkRetailer,
  searchRetailer,
  getRetailers,
  getRetailer,
  updateRetailer,
  deleteRetailer,
} from '../controllers/retailer.controller.js'

const router = Router()
router.use(protect)

// ── Search existing retailer by email (before linking) ──
router.post('/search', authorize('wholesaler'), searchRetailer)

// ── Link existing retailer account to wholesaler ──
router.post('/link',   authorize('wholesaler'), linkRetailer)

// ── Create brand new retailer account ──
router.post('/',       authorize('wholesaler'), createRetailer)

router.get('/',        authorize('wholesaler', 'admin'), getRetailers)
router.get('/:id',     authorize('wholesaler', 'admin'), getRetailer)
router.put('/:id',     authorize('wholesaler'), updateRetailer)
router.delete('/:id',  authorize('wholesaler'), deleteRetailer)

export default router