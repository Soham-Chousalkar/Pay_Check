// Centralized error handling utilities

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
  }
}

export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

export const handleApiError = (error) => {
  if (error instanceof AppError) {
    return error
  }

  // Network errors
  if (!navigator.onLine) {
    return new AppError('No internet connection', ErrorCodes.NETWORK_ERROR, 0)
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new AppError('Network request failed', ErrorCodes.NETWORK_ERROR, 0)
  }

  // HTTP status code errors
  if (error.status) {
    switch (error.status) {
      case 401:
        return new AppError('Authentication required', ErrorCodes.AUTH_ERROR, 401)
      case 403:
        return new AppError('Access denied', ErrorCodes.PERMISSION_ERROR, 403)
      case 404:
        return new AppError('Resource not found', ErrorCodes.NOT_FOUND, 404)
      case 422:
        return new AppError('Invalid data provided', ErrorCodes.VALIDATION_ERROR, 422)
      case 429:
        return new AppError('Too many requests', ErrorCodes.RATE_LIMIT, 429)
      case 500:
        return new AppError('Server error', ErrorCodes.DATABASE_ERROR, 500)
      default:
        return new AppError(`Request failed with status ${error.status}`, ErrorCodes.NETWORK_ERROR, error.status)
    }
  }

  // Default error
  return new AppError(error.message || 'An unexpected error occurred', ErrorCodes.UNKNOWN_ERROR, 500)
}

export const logError = (error, context = '') => {
  console.error(`[${context}] Error:`, {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack
  })
}

export const getErrorMessage = (error) => {
  if (error instanceof AppError) {
    return error.message
  }
  return error.message || 'An unexpected error occurred'
}

export const isRetryableError = (error) => {
  if (error instanceof AppError) {
    return error.code === ErrorCodes.NETWORK_ERROR || 
           error.code === ErrorCodes.RATE_LIMIT ||
           (error.statusCode >= 500 && error.statusCode < 600)
  }
  return false
}

