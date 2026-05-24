import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService.js'

const AuthContext = createContext()

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {
            setError(null)
            const token = localStorage.getItem('authToken')
            if (token) {
                // Check if token is expired before making API call
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]))
                    const currentTime = Date.now() / 1000
                    if (payload.exp && payload.exp < currentTime) {
                        localStorage.removeItem('authToken')
                        setUser(null)
                        setLoading(false)
                        return
                    }
                } catch (e) {
                    // Invalid token format
                    localStorage.removeItem('authToken')
                    setUser(null)
                    setLoading(false)
                    return
                }

                const result = await authService.verifyToken(token)
                if (result.success) {
                    setUser(result.user)
                } else {
                    localStorage.removeItem('authToken')
                    setUser(null)
                }
            } else {
                setUser(null)
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            localStorage.removeItem('authToken')
            setUser(null)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const login = (userData) => {
        setUser(userData)
        setError(null)
    }

    const logout = () => {
        localStorage.removeItem('authToken')
        setUser(null)
        setError(null)
    }

    const clearError = () => {
        setError(null)
    }

    const value = {
        user,
        login,
        logout,
        loading,
        error,
        clearError
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
