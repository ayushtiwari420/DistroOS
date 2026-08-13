import Credit from '../models/Credit.model.js'
import User   from '../models/User.model.js'
import { ApiError, StatusCode } from '../utils/apiError.utils.js'

// ─────────────────────────────────────────────────────────────
// GET /api/credit
// Wholesaler sees all credit accounts
// ─────────────────────────────────────────────────────────────
export const getAllCredit = async (req, res, next) => {
  try {
    const filter = { wholesaler: req.user.id }

    const credits = await Credit.find(filter)
      .populate('retailer', 'name businessName phone city')
      .sort({ currentDue: -1 })

    const totalDue       = credits.reduce((s, c) => s + c.currentDue, 0)
    const overdueCount   = credits.filter(c => c.status === 'overdue').length
    const blockedCount   = credits.filter(c => c.status === 'blocked').length

    return res.status(200).json({
      success: true,
      credits,
      summary: { totalDue, overdueCount, blockedCount, total: credits.length },
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/credit/:retailerId
// Credit details for a specific retailer
// ─────────────────────────────────────────────────────────────
export const getRetailerCredit = async (req, res, next) => {
  try {
    const credit = await Credit.findOne({
      retailer:   req.params.retailerId,
      wholesaler: req.user.id,
    }).populate('retailer', 'name businessName phone')

    if (!credit) throw new ApiError(StatusCode.NOT_FOUND, 'Credit record not found.')

    return res.status(200).json({ success: true, credit })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/credit/:retailerId/debit
// Add to outstanding balance (when order is placed on credit)
// ─────────────────────────────────────────────────────────────
export const debitCredit = async (req, res, next) => {
  try {
    const { amount, note, orderId } = req.body

    const credit = await Credit.findOne({
      retailer:   req.params.retailerId,
      wholesaler: req.user.id,
    })
    if (!credit) throw new ApiError(StatusCode.NOT_FOUND, 'Credit record not found.')

    const newDue = credit.currentDue + amount
    if (credit.creditLimit > 0 && newDue > credit.creditLimit) {
      throw new ApiError(
        StatusCode.BAD_REQUEST,
        `Credit limit exceeded. Limit: ₹${credit.creditLimit}, Current due: ₹${credit.currentDue}`
      )
    }

    credit.currentDue = newDue
    credit.transactions.push({ type: 'debit', amount, note, order: orderId || null })
    if (credit.currentDue > 0) credit.status = 'overdue'

    await credit.save()
    return res.status(200).json({ success: true, message: 'Credit debited.', credit })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/credit/:retailerId/repay
// Record a repayment from retailer
// ─────────────────────────────────────────────────────────────
export const repayCredit = async (req, res, next) => {
  try {
    const { amount, note } = req.body

    const credit = await Credit.findOne({
      retailer:   req.params.retailerId,
      wholesaler: req.user.id,
    })
    if (!credit) throw new ApiError(StatusCode.NOT_FOUND, 'Credit record not found.')

    if (amount > credit.currentDue) {
      throw new ApiError(
        StatusCode.BAD_REQUEST,
        `Repayment ₹${amount} exceeds outstanding due ₹${credit.currentDue}.`
      )
    }

    credit.currentDue      -= amount
    credit.lastPaymentDate  = new Date()
    credit.transactions.push({ type: 'credit', amount, note })
    if (credit.currentDue === 0) credit.status = 'clear'

    await credit.save()
    return res.status(200).json({ success: true, message: 'Payment recorded.', credit })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/credit/:retailerId/limit
// Update credit limit for a retailer
// ─────────────────────────────────────────────────────────────
export const updateCreditLimit = async (req, res, next) => {
  try {
    const { creditLimit } = req.body

    const credit = await Credit.findOneAndUpdate(
      { retailer: req.params.retailerId, wholesaler: req.user.id },
      { creditLimit },
      { new: true }
    )
    if (!credit) throw new ApiError(StatusCode.NOT_FOUND, 'Credit record not found.')

    return res.status(200).json({ success: true, message: 'Credit limit updated.', credit })
  } catch (err) {
    next(err)
  }
}