import express from 'express'
import {
  getAllCredit, getRetailerCredit, debitCredit, repayCredit, updateCreditLimit,
} from './credit.controller.js'
import { protect, authorize } from '../../middleware/auth.middleware.js'
import { validateRepayment } from '../../middleware/validate.middleware.js'

const router = express.Router()

router.use(protect, authorize('wholesaler'))

router.get('/',                    getAllCredit)
router.get('/:retailerId',         getRetailerCredit)
router.post('/:retailerId/debit',  debitCredit)
router.post('/:retailerId/repay',  validateRepayment, repayCredit)
router.patch('/:retailerId/limit', updateCreditLimit)

export default router
