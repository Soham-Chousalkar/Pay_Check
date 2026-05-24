import { renderHook, act } from '@testing-library/react'
import { useErrorHandler } from '../useErrorHandler'

// Mock the error handler utilities
jest.mock('../../utils/errorHandler', () => ({
  logError: jest.fn(),
  getErrorMessage: jest.fn((error) => error.message || 'An unexpected error occurred')
}))

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with no error and not loading', () => {
    const { result } = renderHook(() => useErrorHandler())
    
    expect(result.current.error).toBe(null)
    expect(result.current.isLoading).toBe(false)
    expect(typeof result.current.handleError).toBe('function')
    expect(typeof result.current.clearError).toBe('function')
    expect(typeof result.current.executeWithErrorHandling).toBe('function')
  })

  it('should handle errors and set error state', () => {
    const { result } = renderHook(() => useErrorHandler())
    const testError = new Error('Test error')
    
    act(() => {
      result.current.handleError(testError, 'Test context')
    })
    
    expect(result.current.error).toBe('Test error')
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useErrorHandler())
    const testError = new Error('Test error')
    
    act(() => {
      result.current.handleError(testError)
    })
    
    expect(result.current.error).toBe('Test error')
    
    act(() => {
      result.current.clearError()
    })
    
    expect(result.current.error).toBe(null)
  })

  it('should execute async function with error handling', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const mockAsyncFunction = jest.fn().mockResolvedValue('success')
    
    let returnValue
    await act(async () => {
      returnValue = await result.current.executeWithErrorHandling(mockAsyncFunction, 'Test context')
    })
    
    expect(returnValue).toBe('success')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(mockAsyncFunction).toHaveBeenCalled()
  })

  it('should handle errors in async function', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const testError = new Error('Async error')
    const mockAsyncFunction = jest.fn().mockRejectedValue(testError)
    
    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(mockAsyncFunction, 'Test context')
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Async error')
  })

  it('should set loading state during execution', async () => {
    const { result } = renderHook(() => useErrorHandler())
    let resolvePromise
    const mockAsyncFunction = jest.fn().mockReturnValue(
      new Promise(resolve => {
        resolvePromise = resolve
      })
    )
    
    act(() => {
      result.current.executeWithErrorHandling(mockAsyncFunction, 'Test context')
    })
    
    expect(result.current.isLoading).toBe(true)
    
    await act(async () => {
      resolvePromise('success')
    })
    
    expect(result.current.isLoading).toBe(false)
  })

  it('should clear error before execution', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const testError = new Error('Previous error')
    
    // Set an initial error
    act(() => {
      result.current.handleError(testError)
    })
    
    expect(result.current.error).toBe('Previous error')
    
    const mockAsyncFunction = jest.fn().mockResolvedValue('success')
    
    await act(async () => {
      await result.current.executeWithErrorHandling(mockAsyncFunction, 'Test context')
    })
    
    expect(result.current.error).toBe(null)
  })
})
