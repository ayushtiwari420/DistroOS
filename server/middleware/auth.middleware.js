import { verifyAccessToken } from '../utils/token.utils.js'
import User                  from '../models/User.model.js'

// ─────────────────────────────────────────────────────────────
// protect — verifies JWT access token on every request
// ─────────────────────────────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' })
    }

    const token = authHeader.split(' ')[1]

    // Verify
    let decoded
    try {
      decoded = verifyAccessToken(token)
    } catch (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Access token expired.'
        : 'Invalid access token.'
      return res.status(401).json({ success: false, message })
    }

    // Attach user to request
    req.user = { id: decoded.id, role: decoded.role , wholesaler: decoded.wholesaler }
    next()
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// authorize(...roles) — restricts access to specific roles
// Usage: authorize('admin', 'wholesaler')
// ─────────────────────────────────────────────────────────────
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      })
    }
    next()
  }
}
