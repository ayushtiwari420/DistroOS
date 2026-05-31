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

    const user = await User.findById(decoded.id).select('role wholesaler status')
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' })
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' })
    }

    // Attach the latest account state so retailer-wholesaler links work immediately.
    req.user = {
      id: user._id.toString(),
      role: user.role,
      wholesaler: user.wholesaler ? user.wholesaler.toString() : null,
    }
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