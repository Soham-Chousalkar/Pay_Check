import React from 'react'

const ErrorFallback = ({ error, resetError }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md mx-auto p-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Something went wrong
                </h1>
                <p className="text-gray-600 mb-6">
                    We're sorry, but something unexpected happened. Please try again.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={resetError}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors ml-3"
                    >
                        Refresh Page
                    </button>
                </div>
                {process.env.NODE_ENV === 'development' && error && (
                    <details className="mt-6 text-left">
                        <summary className="cursor-pointer text-sm text-gray-500">
                            Error Details (Development)
                        </summary>
                        <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto">
                            {error.toString()}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    )
}

export default ErrorFallback
