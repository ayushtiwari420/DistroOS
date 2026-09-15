import { apiClient } from '../api/client'

const request = (endpoint, options = {}) => apiClient(endpoint, options)
const requestForm = (endpoint, formData, method = 'POST') =>
  apiClient(endpoint, { method, body: formData })

// ── GET /api/profile ──────────────────────────────────────────────────────────
export const fetchProfile = () => request('/profile')

// ── PUT /api/profile ──────────────────────────────────────────────────────────
export const saveProfile = (payload) =>
  request('/profile', { method: 'PUT', body: JSON.stringify(payload) })

// ── PUT /api/profile/password ──────────────────────────────────────────────
export const changePassword = (payload) =>
  request('/profile/password', { method: 'PUT', body: JSON.stringify(payload) })

// ── POST /api/profile/avatar ──────────────────────────────────────────────
export const uploadAvatar = (file) => {
  const fd = new FormData()
  fd.append('avatar', file)
  return requestForm('/profile/avatar', fd, 'POST')
}

// ── DELETE /api/profile/avatar ────────────────────────────────────────────
export const removeAvatar = () => request('/profile/avatar', { method: 'DELETE' })
