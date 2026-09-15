import Credit from './credit.model.js'
import User from '../users/user.model.js'
import { ApiError, StatusCode } from '../../utils/apiError.utils.js'

export const getAllCredit = async (wholesalerId) => {
  const credits = await Credit.find({ wholesaler: wholesalerId })
    .select('-transactions')
    .populate('retailer', 'name businessName phone city')
    .sort({ currentDue: -1 })

  const totalDue     = credits.reduce((s, c) => s + c.currentDue, 0)
  const overdueCount = credits.filter(c => c.status === 'overdue').length
  const blockedCount = credits.filter(c => c.status === 'blocked').length

  return {
    credits,
    summary: { totalDue, overdueCount, blockedCount, total: credits.length },
  }
}

export const getRetailerCredit = async (wholesalerId, retailerId) => {
  const credit = await Credit.findOne({
    retailer:   retailerId,
    wholesaler: wholesalerId,
  }).populate('retailer', 'name businessName phone')

  if (!credit) throw new ApiError(StatusCode.NOT_FOUND, 'Credit record not found.')
  return credit
}

export const debitCredit = async (wholesalerId, retailerId, amount, note, orderId) => {
  const credit = await Credit.findOne({
    retailer:   retailerId,
    wholesaler: wholesalerId,
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
  credit.transactions.push({ type: 'debit', amount, runningBalance: newDue, note, order: orderId || null })
  if (credit.currentDue > 0) credit.status = 'overdue'

  await credit.save()
  return credit
}

export const repayCredit = async (wholesalerId, retailerId, amount, note) => {
  const credit = await Credit.findOne({
    retailer:   retailerId,
    wholesaler: wholesalerId,
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
  credit.transactions.push({ type: 'credit', amount, runningBalance: credit.currentDue, note })
  if (credit.currentDue === 0) credit.status = 'clear'

  await credit.save()
  return credit
}

export const updateCreditLimit = async (wholesalerId, retailerId, creditLimit) => {
  const credit = await Credit.findOneAndUpdate(
    { retailer: retailerId, wholesaler: wholesalerId },
    { creditLimit },
    { new: true }
  )
  if (!credit) throw new ApiError(StatusCode.NOT_FOUND, 'Credit record not found.')
  return credit
}
