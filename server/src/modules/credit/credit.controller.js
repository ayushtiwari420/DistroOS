import * as creditService from './credit.service.js'

export const getAllCredit = async (req, res, next) => {
  try {
    const result = await creditService.getAllCredit(req.user.id)
    return res.status(200).json({ success: true, ...result })
  } catch (err) { next(err) }
}

export const getRetailerCredit = async (req, res, next) => {
  try {
    const credit = await creditService.getRetailerCredit(req.user.id, req.params.retailerId)
    return res.status(200).json({ success: true, credit })
  } catch (err) { next(err) }
}

export const debitCredit = async (req, res, next) => {
  try {
    const { amount, note, orderId } = req.body
    const credit = await creditService.debitCredit(req.user.id, req.params.retailerId, Number(amount), note, orderId)
    return res.status(200).json({ success: true, message: 'Credit debited.', credit })
  } catch (err) { next(err) }
}

export const repayCredit = async (req, res, next) => {
  try {
    const { amount, note } = req.body
    const credit = await creditService.repayCredit(req.user.id, req.params.retailerId, Number(amount), note)
    return res.status(200).json({ success: true, message: 'Payment recorded.', credit })
  } catch (err) { next(err) }
}

export const updateCreditLimit = async (req, res, next) => {
  try {
    const { creditLimit } = req.body
    const credit = await creditService.updateCreditLimit(req.user.id, req.params.retailerId, Number(creditLimit))
    return res.status(200).json({ success: true, message: 'Credit limit updated.', credit })
  } catch (err) { next(err) }
}
