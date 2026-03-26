import { Router }   from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { getWholesalers, updateWholesalerStatus, getPlatformStats } from '../controllers/admin.controller.js'

const router = Router()
router.use(protect)
router.use(authorize('admin'))

router.get('/stats',                    getPlatformStats)
router.get('/wholesalers',              getWholesalers)
router.patch('/wholesalers/:id/status', updateWholesalerStatus)

export default router