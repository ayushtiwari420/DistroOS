import { Router }   from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { createProduct, getProducts, getProduct, updateProduct, deleteProduct, adjustStock, getLowStockProducts, bulkUploadProducts } from '../controllers/product.controller.js'
import upload from '../middleware/upload.middleware.js'
import excelUpload from '../middleware/excelUpload.middleware.js'

const router = Router()
router.use(protect)

router.get('/low-stock',   authorize('wholesaler'), getLowStockProducts)
router.post('/',           authorize('wholesaler'), upload.single('image'), createProduct)
router.post('/bulk-update', authorize('wholesaler'), excelUpload.single('file'), bulkUploadProducts)
router.post('/bulk-upload', authorize('wholesaler'), excelUpload.single('file'), bulkUploadProducts)
router.get('/',            getProducts)
router.get('/:id',         getProduct)
router.put('/:id',         authorize('wholesaler'), upload.single('image'), updateProduct)
router.delete('/:id',      authorize('wholesaler'), deleteProduct)
router.patch('/:id/stock', authorize('wholesaler'), adjustStock)
export default router
