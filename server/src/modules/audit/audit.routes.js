import express from 'express'
import { getAuditLogs } from './audit.controller.js'
import { protect, authorize } from '../../middleware/auth.middleware.js'

const router = express.Router()

router.use(protect, authorize('wholesaler', 'admin'))

router.get('/', getAuditLogs)

export default router
