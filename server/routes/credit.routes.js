import { Router }   from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { getAllCredit, getRetailerCredit, debitCredit, repayCredit, updateCreditLimit } from '../controllers/credit.controller.js'

const router = Router()
router.use(protect)
router.use(authorize('wholesaler'))

router.get('/',                    getAllCredit)
router.get('/:retailerId',         getRetailerCredit)
router.post('/:retailerId/debit',  debitCredit)
router.post('/:retailerId/repay',  repayCredit)
router.patch('/:retailerId/limit', updateCreditLimit)

export default router