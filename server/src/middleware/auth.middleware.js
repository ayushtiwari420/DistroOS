import { verifyAccessToken } from '../utils/token.utils.js'
import User from '../modules/users/user.model.js'
import { ApiError, StatusCode } from '../utils/apiError.utils.js'

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(StatusCode.UNAUTHORIZED, 'Access denied. No token provided.')
    }

    const token = authHeader.split(' ')[1]

    let decoded
    try {
      decoded = verifyAccessToken(token)
    } catch (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Access token expired.'
        : 'Invalid access token.'
      throw new ApiError(StatusCode.UNAUTHORIZED, message)
    }

    const user = await User.findById(decoded.id).select('role wholesaler status')
    if (!user) {
      throw new ApiError(StatusCode.UNAUTHORIZED, 'User no longer exists.')
    }

    if (user.status === 'suspended') {
      throw new ApiError(StatusCode.FORBIDDEN, 'Your account has been suspended.')
    }

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

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(
        StatusCode.FORBIDDEN,
        `Access denied. Required role: ${roles.join(' or ')}.`
      ))
    }
    next()
  }
}
