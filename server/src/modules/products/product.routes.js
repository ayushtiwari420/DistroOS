import express from 'express'
import {
  createProduct, getProducts, getLowStockProducts, getProduct,
  updateProduct, deleteProduct, adjustStock, bulkUpdateProducts,
} from './product.controller.js'
import { protect, authorize } from '../../middleware/auth.middleware.js'
import upload from '../../middleware/upload.middleware.js'
import excelUpload from '../../middleware/excelUpload.middleware.js'
import { validateCreateProduct } from '../../middleware/validate.middleware.js'

const router = express.Router()

router.use(protect)

router.get('/',            getProducts)
router.get('/low-stock',   authorize('wholesaler'), getLowStockProducts)
router.get('/:id',         getProduct)

router.post('/',           authorize('wholesaler'), upload.single('image'), validateCreateProduct, createProduct)
router.put('/:id',         authorize('wholesaler'), upload.single('image'), updateProduct)
router.delete('/:id',      authorize('wholesaler'), deleteProduct)
router.patch('/:id/stock', authorize('wholesaler'), adjustStock)
router.post('/bulk-upload', authorize('wholesaler'), excelUpload.single('file'), bulkUpdateProducts)

export default router
