const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── Helper ────────────────────────────────────────────────────
const request = async (endpoint, options = {}) => {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers:     { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',   // REQUIRED — sends httpOnly cookie cross-origin
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    const err    = new Error(data.message || 'Something went wrong.')
    err.errors   = data.errors || null
    err.status   = res.status
    throw err
  }

  return data
}

// ── Register ──────────────────────────────────────────────────
export const registerUser = (payload) =>
  request('/auth/register', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })

// ── Login ─────────────────────────────────────────────────────
export const loginUser = (payload) =>
  request('/auth/login', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })

// ── Refresh access token (uses httpOnly cookie automatically) ──
export const refreshToken = () =>
  request('/auth/refresh', {
    method: 'POST',
  })

// ── Logout ────────────────────────────────────────────────────
export const logoutUser = () =>
  request('/auth/logout', {
    method: 'POST',
  })

// ── Get current user ──────────────────────────────────────────
export const getMe = (accessToken) =>
  request('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
