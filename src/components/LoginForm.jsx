import { useState } from 'react'
import { authService } from '../services/authService.js'
import { safeJson } from '../utils/safeJson.js'

export default function LoginForm({ onLogin, onSwitchToRegister }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showForgotPassword, setShowForgotPassword] = useState(false)



    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await authService.login(formData.email, formData.password)
            if (result.success) {
                localStorage.setItem('authToken', result.token)
                onLogin(result.user)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!formData.email) {
            setError('Please enter your email address')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email })
            })

            if (!response.ok) {
                const msg = await response.text().catch(() => '')
                throw new Error(`API error ${response.status}: ${msg}`)
            }
            const result = await safeJson(response)

            if (result.success) {
                setError('')
                alert('Your password has been sent to your email address')
            } else {
                setError(result.message)
            }
        } catch (err) {
            setError('Failed to send password. Please try again.')
        } finally {
            setLoading(false)
        }
    }



    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-1/3 mx-auto space-y-6" style={{
                background: '#ECEEDF',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid #D9C4B0',
                padding: '1.5rem'
            }}>
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to Pay Check
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            create a new account
                        </button>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none relative block w-full px-3 py-3 border-0 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                                style={{
                                    background: 'rgba(240, 240, 240, 0.4)',
                                    boxShadow: 'inset 6px 6px 12px rgba(0, 0, 0, 0.1), inset -6px -6px 12px rgba(255, 255, 255, 0.3)'
                                }}
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none relative block w-full px-3 py-3 border-0 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                                style={{
                                    background: 'rgba(240, 240, 240, 0.4)',
                                    boxShadow: 'inset 6px 6px 12px rgba(0, 0, 0, 0.1), inset -6px -6px 12px rgba(255, 255, 255, 0.3)'
                                }}
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center">{error}</div>
                    )}

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(!showForgotPassword)}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                            Forgot your password?
                        </button>
                    </div>

                    {showForgotPassword && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600 mb-3">
                                Enter your email address and we'll send you your current password.
                            </p>
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border-0 text-sm font-medium rounded-lg text-gray-800 focus:outline-none disabled:opacity-50"
                                style={{
                                    background: 'rgba(240, 240, 240, 0.4)',
                                    boxShadow: '6px 6px 12px rgba(0, 0, 0, 0.2), -6px -6px 12px rgba(255, 255, 255, 0.3)'
                                }}
                            >
                                {loading ? 'Sending...' : 'Send Password'}
                            </button>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border-0 text-sm font-medium rounded-lg text-gray-800 focus:outline-none disabled:opacity-50"
                            style={{
                                background: 'rgba(240, 240, 240, 0.4)',
                                boxShadow: '6px 6px 12px rgba(0, 0, 0, 0.2), -6px -6px 12px rgba(255, 255, 255, 0.3)'
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>


                </form>
            </div>
        </div>
    )
}
