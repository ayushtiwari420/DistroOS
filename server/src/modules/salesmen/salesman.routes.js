import express from 'express'
import {
  createSalesman, getSalesmen, getSalesman, updateSalesman, deleteSalesman,
} from './salesman.controller.js'
import { protect, authorize } from '../../middleware/auth.middleware.js'

const router = express.Router()

router.use(protect)

router.get('/',       getSalesmen)
router.get('/:id',    getSalesman)

router.post('/',      authorize('wholesaler'), createSalesman)
router.put('/:id',    authorize('wholesaler'), updateSalesman)
router.delete('/:id', authorize('wholesaler'), deleteSalesman)

export default router
