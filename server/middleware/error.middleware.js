import { ApiError, StatusCode } from '../utils/apiError.utils.js'

export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`)

  let error = err

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    error = new ApiError(
      StatusCode.CONFLICT,
      `${field.charAt(0).toUpperCase() + field.slice(1)} already in use.`
    )
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    error = new ApiError(StatusCode.UNPROCESSABLE_ENTITY, messages.join(', '), messages)
  }

  if (err.name === 'CastError') {
    error = new ApiError(StatusCode.BAD_REQUEST, 'Invalid ID format.')
  }

  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(StatusCode.UNAUTHORIZED, 'Invalid token.')
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(StatusCode.UNAUTHORIZED, 'Token expired.')
  }

  const statusCode = error.statusCode || StatusCode.INTERNAL_SERVER_ERROR

  res.status(statusCode).json({
    success: false,
    statusCode,
    message: error.message || 'Internal server error.',
    ...(error.errors?.length && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  })
}
