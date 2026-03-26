import { Router }   from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { createProduct, getProducts, getProduct, updateProduct, deleteProduct, adjustStock, getLowStockProducts } from '../controllers/product.controller.js'

const router = Router()
router.use(protect)

router.get('/low-stock',   authorize('wholesaler'), getLowStockProducts)
router.post('/',           authorize('wholesaler'), createProduct)
router.get('/',            getProducts)
router.get('/:id',         getProduct)
router.put('/:id',         authorize('wholesaler'), updateProduct)
router.delete('/:id',      authorize('wholesaler'), deleteProduct)
router.patch('/:id/stock', authorize('wholesaler'), adjustStock)

export default router