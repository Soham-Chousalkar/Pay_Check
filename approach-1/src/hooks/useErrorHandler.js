import { useState, useCallback } from 'react'
import { logError, getErrorMessage } from '../utils/errorHandler'

export const useErrorHandler = () => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error, context = '') => {
    logError(error, context)
    setError(getErrorMessage(error))
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const executeWithErrorHandling = useCallback(async (asyncFunction, context = '') => {
    try {
      setIsLoading(true)
      clearError()
      return await asyncFunction()
    } catch (error) {
      handleError(error, context)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [handleError, clearError])

  return {
    error,
    isLoading,
    handleError,
    clearError,
    executeWithErrorHandling
  }
}
