import { apiClient as api } from '../api/client'

// ── ORDERS ────────────────────────────────────────────────────
export const getOrderStats  = ()               => api('/orders/stats')
export const getOrders      = (params = '')    => api(`/orders${params}`)
export const updateOrderStatus = (id, status, reason) =>
  api(`/orders/${id}/status`, {
    method: 'PATCH',
    body:   JSON.stringify({ status, rejectionReason: reason }),
  })

// ── PRODUCTS ──────────────────────────────────────────────────
export const getProducts     = (params = '')   => api(`/products${params}`)
export const getLowStock     = ()              => api('/products/low-stock')
export const createProduct   = (body)          => api('/products', { method: 'POST', body: JSON.stringify(body) })
export const updateProduct   = (id, body)      => api(`/products/${id}`, { method: 'PUT',   body: JSON.stringify(body) })
export const deleteProduct   = (id)            => api(`/products/${id}`, { method: 'DELETE' })
export const adjustStock     = (id, qty, type) => api(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ quantity: qty, type }) })

// ── RETAILERS ─────────────────────────────────────────────────
export const getRetailers    = (params = '')   => api(`/retailers${params}`)
export const getRetailer     = (id)            => api(`/retailers/${id}`)
export const createRetailer  = (body)          => api('/retailers',    { method: 'POST',   body: JSON.stringify(body) })
export const updateRetailer  = (id, body)      => api(`/retailers/${id}`, { method: 'PUT', body: JSON.stringify(body) })

// ── SALESMEN ──────────────────────────────────────────────────
export const getSalesmen     = (params = '')   => api(`/salesmen${params}`)
export const getSalesman     = (id)            => api(`/salesmen/${id}`)
export const createSalesman  = (body)          => api('/salesmen',     { method: 'POST',   body: JSON.stringify(body) })
export const updateSalesman  = (id, body)      => api(`/salesmen/${id}`, { method: 'PUT',    body: JSON.stringify(body) })
export const deleteSalesman  = (id)            => api(`/salesmen/${id}`, { method: 'DELETE' })


// ── CREDIT & ANALYTICS ─────────────────────────────────────────
export const getAllCredit                  = ()              => api('/credit')
export const getCreditIntelligence          = (params = '')   => api(`/analytics/credit-intelligence${params}`)
export const getRetailerCredit              = (retailerId)    => api(`/credit/${retailerId}`)
export const recordRepayment                = (retailerId, amount, note) =>
  api(`/credit/${retailerId}/repay`, { method: 'POST', body: JSON.stringify({ amount, note }) })
export const updateCreditLimit              = (retailerId, creditLimit) =>
  api(`/credit/${retailerId}/limit`, { method: 'PATCH', body: JSON.stringify({ creditLimit }) })

export const getExecutiveDashboardAnalytics = (params = '')   => api(`/analytics/dashboard${params}`)
export const getProductAnalytics            = (params = '')   => api(`/analytics/products${params}`)
export const getRetailerAnalytics           = (params = '')   => api(`/analytics/retailers${params}`)
export const getInventoryIntelligence       = (params = '')   => api(`/analytics/inventory-intelligence${params}`)
export const getReorderRecommendations      = (params = '')   => api(`/analytics/reorder-recommendations${params}`)