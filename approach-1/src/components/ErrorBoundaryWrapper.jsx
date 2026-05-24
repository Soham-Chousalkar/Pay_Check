import React from 'react'
import ErrorBoundary from './ErrorBoundary'
import ErrorFallback from './ErrorFallback'

const ErrorBoundaryWrapper = ({ children, fallback = ErrorFallback }) => {
    return (
        <ErrorBoundary fallback={fallback}>
            {children}
        </ErrorBoundary>
    )
}

export default ErrorBoundaryWrapper
