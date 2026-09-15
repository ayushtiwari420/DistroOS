import jwt from 'jsonwebtoken'

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, wholesaler: user.wholesaler },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  )
}

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, wholesaler: user.wholesaler },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  )
}

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET)
}

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
}

export const setRefreshCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
    path:     '/',
  })
}

export const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path:     '/',
  })
}
