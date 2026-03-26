import { Router }   from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { createSalesman, getSalesmen, getSalesman, updateSalesman, deleteSalesman } from '../controllers/salesman.controller.js'

const router = Router()
router.use(protect)

router.post('/',     authorize('wholesaler'), createSalesman)
router.get('/',      authorize('wholesaler', 'admin'), getSalesmen)
router.get('/:id',   authorize('wholesaler', 'admin'), getSalesman)
router.put('/:id',   authorize('wholesaler'), updateSalesman)
router.delete('/:id', authorize('wholesaler'), deleteSalesman)

export default router