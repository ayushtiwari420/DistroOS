import express from 'express'
import { getWholesalers, updateWholesalerStatus, getPlatformStats } from './admin.controller.js'
import { protect, authorize } from '../../middleware/auth.middleware.js'

const router = express.Router()

router.use(protect, authorize('admin'))

router.get('/wholesalers',            getWholesalers)
router.patch('/wholesalers/:id/status', updateWholesalerStatus)
router.get('/stats',                  getPlatformStats)

export default router
