import { getAccessToken } from '../context/AuthContext'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── Authenticated JSON request ──────────────────────────────────────────────
const request = async (endpoint, options = {}) => {
  const token = getAccessToken()
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  })

  const data = await res.json()
  if (!res.ok) {
    const err    = new Error(data.message || 'Something went wrong.')
    err.status   = res.status
    err.errors   = data.errors || null
    throw err
  }
  return data
}

// ── Authenticated multipart/form-data request ────────────────────────────────
const requestForm = async (endpoint, formData, method = 'POST') => {
  const token = getAccessToken()
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) {
    const err    = new Error(data.message || 'Something went wrong.')
    err.status   = res.status
    throw err
  }
  return data
}

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
