import express from 'express'
import {
  linkRetailer, searchRetailer, createRetailer, getRetailers,
  getRetailer, getRetailerInsights, updateRetailer, deleteRetailer,
} from './retailer.controller.js'
import { protect, authorize } from '../../middleware/auth.middleware.js'

const router = express.Router()

router.use(protect)

router.get('/',               getRetailers)
router.get('/:id/insights',   authorize('wholesaler'), getRetailerInsights)
router.get('/:id',            getRetailer)

router.post('/link',   authorize('wholesaler'), linkRetailer)
router.post('/search', authorize('wholesaler'), searchRetailer)
router.post('/',       authorize('wholesaler'), createRetailer)
router.put('/:id',     authorize('wholesaler'), updateRetailer)
router.delete('/:id',  authorize('wholesaler'), deleteRetailer)

export default router
