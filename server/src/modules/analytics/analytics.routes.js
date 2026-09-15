import express from 'express'
import {
  getExecutiveDashboardAnalytics,
  getProductAnalytics,
  getRetailerAnalytics,
  getInventoryAnalytics,
  getInventoryIntelligence,
  getRetailerInsights,
  getSmartReorderSuggestions,
  getSmartReorderRecommendations,
  calculateCreditTrustScore,
  getCreditIntelligence,
  getNetworkAggregatedDemand,
} from './analytics.controller.js'
import { protect, authorize } from '../../middleware/auth.middleware.js'

const router = express.Router()

router.use(protect, authorize('wholesaler'))

// ── Intelligence Foundation REST Endpoints ──
router.get('/dashboard',                     getExecutiveDashboardAnalytics)
router.get('/overview',                      getExecutiveDashboardAnalytics)
router.get('/products',                      getProductAnalytics)
router.get('/retailers',                     getRetailerAnalytics)
router.get('/inventory',                     getInventoryAnalytics)
router.get('/inventory-intelligence',        getInventoryIntelligence)
router.get('/credit',                        getCreditIntelligence)
router.get('/credit-intelligence',           getCreditIntelligence)
router.get('/retailers/:retailerId/insights', getRetailerInsights)
router.get('/retailer-360/:retailerId',       getRetailerInsights)
router.get('/reorder-recommendations',       getSmartReorderRecommendations)

// ── Backwards Compatible Endpoints ──
router.get('/smart-reorder',                 getSmartReorderSuggestions)
router.get('/smart-reorder/:retailerId',     getSmartReorderSuggestions)
router.get('/credit-score/:retailerId',      calculateCreditTrustScore)
router.get('/network-demand',                getNetworkAggregatedDemand)

export default router
