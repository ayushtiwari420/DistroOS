import jwt from 'jsonwebtoken'

// ── Generate access token (short-lived) ──
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  )
}

// ── Generate refresh token (long-lived) ──
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  )
}

// ── Verify access token ──
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET)
}

// ── Verify refresh token ──
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
}

// ── Set refresh token as httpOnly cookie ──
export const setRefreshCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   isProd,         // false in dev (no HTTPS needed)
    sameSite: isProd ? 'strict' : 'lax',  // 'lax' allows cross-port in dev
    maxAge:   7 * 24 * 60 * 60 * 1000,   // 7 days
    path:     '/',
  })
}

// ── Clear refresh token cookie ──
export const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path:     '/',
  })
}
