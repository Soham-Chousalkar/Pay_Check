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

    useEffect(() => {
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('authToken')
            if (token) {
                const result = await authService.verifyToken(token)
                if (result.success) {
                    setUser(result.user)
                } else {
                    localStorage.removeItem('authToken')
                }
            }
        } catch (error) {
            localStorage.removeItem('authToken')
        } finally {
            setLoading(false)
        }
    }

    const login = (userData) => {
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('authToken')
        setUser(null)
    }

    const value = {
        user,
        login,
        logout,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
