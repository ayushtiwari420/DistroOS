export class StatusCode {
  static OK = 200
  static CREATED = 201
  static BAD_REQUEST = 400
  static UNAUTHORIZED = 401
  static FORBIDDEN = 403
  static NOT_FOUND = 404
  static CONFLICT = 409
  static UNPROCESSABLE_ENTITY = 422
  static BAD_GATEWAY = 502
  static INTERNAL_SERVER_ERROR = 500
}

export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errors = errors
    this.isOperational = true

    Error.captureStackTrace?.(this, this.constructor)
  }
}
