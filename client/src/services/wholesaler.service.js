import { getAccessToken } from '../context/AuthContext'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── Authenticated request helper ──────────────────────────────
const api = async (endpoint, options = {}) => {
  const token = getAccessToken()
  const res   = await fetch(`${BASE}${endpoint}`, {
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

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
export const createSalesman  = (body)          => api('/salesmen',     { method: 'POST',   body: JSON.stringify(body) })
export const updateSalesman  = (id, body)      => api(`/salesmen/${id}`, { method: 'PUT', body: JSON.stringify(body) })

// ── CREDIT ────────────────────────────────────────────────────
export const getAllCredit     = ()              => api('/credit')
export const getRetailerCredit = (retailerId)  => api(`/credit/${retailerId}`)
export const recordRepayment = (retailerId, amount, note) =>
  api(`/credit/${retailerId}/repay`, { method: 'POST', body: JSON.stringify({ amount, note }) })
export const updateCreditLimit = (retailerId, creditLimit) =>
  api(`/credit/${retailerId}/limit`, { method: 'PATCH', body: JSON.stringify({ creditLimit }) })