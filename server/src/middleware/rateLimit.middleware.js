import { ApiError, StatusCode } from '../utils/apiError.utils.js'

const requestCounts = new Map()

export const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' }) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
    const key = `${req.baseUrl}${req.path}:${ip}`
    const now = Date.now()

    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs })
      return next()
    }

    const record = requestCounts.get(key)

    if (now > record.resetTime) {
      record.count = 1
      record.resetTime = now + windowMs
      return next()
    }

    record.count += 1

    if (record.count > max) {
      return next(new ApiError(StatusCode.FORBIDDEN, message))
    }

    next()
  }
}

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
})

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'API rate limit exceeded. Please slow down your requests.',
})
