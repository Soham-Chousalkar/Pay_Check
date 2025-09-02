import { useState } from 'react'
import LoginForm from './LoginForm.jsx'
import RegisterForm from './RegisterForm.jsx'

export default function AuthPage({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true)

    const handleLogin = (user) => {
        onLogin(user)
    }

    const switchToRegister = () => {
        setIsLogin(false)
    }

    const switchToLogin = () => {
        setIsLogin(true)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {isLogin ? (
                <LoginForm
                    onLogin={handleLogin}
                    onSwitchToRegister={switchToRegister}
                />
            ) : (
                <RegisterForm
                    onRegister={handleLogin}
                    onSwitchToLogin={switchToLogin}
                />
            )}
        </div>
    )
}
