import * as retailerService from './retailer.service.js'
import * as analyticsService from '../analytics/analytics.service.js'

export const linkRetailer = async (req, res, next) => {
  try {
    const { email, creditLimit } = req.body
    const retailer = await retailerService.linkRetailer(req.user.id, email, creditLimit)
    return res.status(200).json({
      success: true,
      message: `${retailer.name} has been linked to your account.`,
      retailer,
    })
  } catch (err) { next(err) }
}

export const searchRetailer = async (req, res, next) => {
  try {
    const result = await retailerService.searchRetailer(req.user.id, req.body.email)
    return res.status(200).json({ success: true, ...result })
  } catch (err) { next(err) }
}

export const createRetailer = async (req, res, next) => {
  try {
    const retailer = await retailerService.createRetailer(req.user.id, req.body)
    return res.status(201).json({
      success: true,
      message: 'Retailer account created and linked.',
      retailer,
    })
  } catch (err) { next(err) }
}

export const getRetailers = async (req, res, next) => {
  try {
    const result = await retailerService.getRetailers(req.user, req.query)
    return res.status(200).json({ success: true, ...result })
  } catch (err) { next(err) }
}

export const getRetailer = async (req, res, next) => {
  try {
    const retailer = await retailerService.getRetailerById(req.params.id, req.user.id)
    return res.status(200).json({ success: true, retailer })
  } catch (err) { next(err) }
}

export const getRetailerInsights = async (req, res, next) => {
  try {
    const data = await analyticsService.getRetailerInsights(req.user.id, req.params.id)
    return res.status(200).json({ success: true, ...data })
  } catch (err) { next(err) }
}

export const updateRetailer = async (req, res, next) => {
  try {
    const retailer = await retailerService.updateRetailer(req.params.id, req.user.id, req.body)
    return res.status(200).json({ success: true, message: 'Retailer updated.', retailer })
  } catch (err) { next(err) }
}

export const deleteRetailer = async (req, res, next) => {
  try {
    await retailerService.deleteRetailer(req.params.id, req.user.id)
    return res.status(200).json({ success: true, message: 'Retailer unlinked from your account.' })
  } catch (err) { next(err) }
}
