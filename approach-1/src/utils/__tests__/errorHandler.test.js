import { AppError, ErrorCodes, handleApiError, logError, getErrorMessage, isRetryableError } from '../errorHandler'

// Mock console.error
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

describe('errorHandler', () => {
  beforeEach(() => {
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error')
      
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('UNKNOWN_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe('AppError')
    })

    it('should create error with custom values', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400)
      
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.statusCode).toBe(400)
    })
  })

  describe('handleApiError', () => {
    it('should return AppError as is', () => {
      const appError = new AppError('Test error', 'TEST_CODE', 400)
      const result = handleApiError(appError)
      
      expect(result).toBe(appError)
    })

    it('should handle network errors when offline', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const error = new Error('Network error')
      const result = handleApiError(error)
      
      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(ErrorCodes.NETWORK_ERROR)
      expect(result.message).toBe('No internet connection')
    })

    it('should handle fetch errors', () => {
      // Mock navigator.onLine to true for this test
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      const error = new TypeError('Failed to fetch')
      const result = handleApiError(error)
      
      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(ErrorCodes.NETWORK_ERROR)
      expect(result.message).toBe('Network request failed')
    })

    it('should handle HTTP status codes', () => {
      // Mock navigator.onLine to true for this test
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      const error = new Error('Request failed')
      error.status = 401
      
      const result = handleApiError(error)
      
      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(ErrorCodes.AUTH_ERROR)
      expect(result.statusCode).toBe(401)
    })

    it('should handle unknown errors', () => {
      // Mock navigator.onLine to true for this test
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      const error = new Error('Unknown error')
      const result = handleApiError(error)
      
      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(ErrorCodes.UNKNOWN_ERROR)
      expect(result.message).toBe('Unknown error')
    })
  })

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400)
      
      logError(error, 'Test context')
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Test context] Error:',
        expect.objectContaining({
          message: 'Test error',
          code: 'TEST_CODE',
          statusCode: 400,
          stack: expect.any(String)
        })
      )
    })

    it('should log error without context', () => {
      const error = new Error('Test error')
      
      logError(error)
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[] Error:',
        expect.objectContaining({
          message: 'Test error'
        })
      )
    })
  })

  describe('getErrorMessage', () => {
    it('should return message from AppError', () => {
      const appError = new AppError('Test error', 'TEST_CODE', 400)
      const message = getErrorMessage(appError)
      
      expect(message).toBe('Test error')
    })

    it('should return message from regular Error', () => {
      const error = new Error('Test error')
      const message = getErrorMessage(error)
      
      expect(message).toBe('Test error')
    })

    it('should return default message for error without message', () => {
      const error = {}
      const message = getErrorMessage(error)
      
      expect(message).toBe('An unexpected error occurred')
    })
  })

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = new AppError('Network error', ErrorCodes.NETWORK_ERROR, 0)
      
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for rate limit errors', () => {
      const error = new AppError('Rate limited', ErrorCodes.RATE_LIMIT, 429)
      
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for 5xx errors', () => {
      const error = new AppError('Server error', ErrorCodes.DATABASE_ERROR, 500)
      
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for 4xx errors', () => {
      const error = new AppError('Not found', ErrorCodes.NOT_FOUND, 404)
      
      expect(isRetryableError(error)).toBe(false)
    })

    it('should return false for non-AppError', () => {
      const error = new Error('Regular error')
      
      expect(isRetryableError(error)).toBe(false)
    })
  })
})
