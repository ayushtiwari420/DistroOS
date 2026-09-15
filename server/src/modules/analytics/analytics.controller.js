import * as analyticsService from './analytics.service.js'

export const getExecutiveDashboardAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getExecutiveDashboardAnalytics(req.user.id, req.query)
    return res.status(200).json({ success: true, data, analytics: data })
  } catch (err) {
    next(err)
  }
}

export const getProductAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getProductAnalytics(req.user.id, req.query)
    return res.status(200).json({ success: true, ...data })
  } catch (err) {
    next(err)
  }
}

export const getRetailerAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getRetailerAnalytics(req.user.id, req.query)
    return res.status(200).json({ success: true, ...data })
  } catch (err) {
    next(err)
  }
}

export const getInventoryAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getInventoryAnalytics(req.user.id, req.query)
    return res.status(200).json({ success: true, ...data })
  } catch (err) {
    next(err)
  }
}

export const getInventoryIntelligence = async (req, res, next) => {
  try {
    const data = await analyticsService.getInventoryIntelligence(req.user.id, req.query)
    return res.status(200).json({ success: true, ...data })
  } catch (err) {
    next(err)
  }
}

export const getRetailerInsights = async (req, res, next) => {
  try {
    const retailerId = req.params.retailerId || req.params.id
    const data = await analyticsService.getRetailerInsights(req.user.id, retailerId)
    return res.status(200).json({ success: true, ...data })
  } catch (err) {
    next(err)
  }
}

export const getRetailer360 = async (req, res, next) => {
  return getRetailerInsights(req.user.id ? req : req, res, next)
}

export const getSmartReorderSuggestions = async (req, res, next) => {
  try {
    const retailerId = req.params.retailerId || null
    const suggestions = await analyticsService.getSmartReorderSuggestions(req.user.id, retailerId)
    return res.status(200).json({ success: true, suggestions, total: suggestions.length })
  } catch (err) {
    next(err)
  }
}

export const getSmartReorderRecommendations = async (req, res, next) => {
  try {
    const data = await analyticsService.getSmartReorderRecommendations(req.user.id, req.query)
    return res.status(200).json({ success: true, ...data })
  } catch (err) {
    next(err)
  }
}

export const calculateCreditTrustScore = async (req, res, next) => {
  try {
    const creditScore = await analyticsService.calculateCreditTrustScore(
      req.user.id,
      req.params.retailerId || req.params.id
    )
    return res.status(200).json({ success: true, creditScore })
  } catch (err) {
    next(err)
  }
}

export const getNetworkAggregatedDemand = async (req, res, next) => {
  try {
    const demand = await analyticsService.getNetworkAggregatedDemand(req.user.id)
    return res.status(200).json({ success: true, demand })
  } catch (err) {
    next(err)
  }
}
