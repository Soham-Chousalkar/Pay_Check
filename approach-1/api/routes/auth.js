import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { TursoAdapter } from '../database/TursoAdapter.js'
import { emailService } from '../services/emailService.js'

const router = express.Router()
const db = new TursoAdapter()
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.error('JWT_SECRET environment variable is required!')
  process.exit(1)
})()

// Generate random password for new accounts
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Generate unique user ID
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      })
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      })
    }

    // Validate name length
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      })
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      })
    }

    // Generate user ID and hash password
    const userId = generateUserId()
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    await db.createUser({
      id: userId,
      email,
      name,
      password_hash: passwordHash,
      is_verified: false
    })

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, name)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail registration if email fails
    }

    res.json({ 
      success: true, 
      message: 'Registration successful. You can now log in with your credentials.' 
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    })
  }
})

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      })
    }

    // Get user
    const user = await db.getUserByEmail(email)
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.is_verified
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    })
  }
})

// Verify JWT token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await db.getUserById(decoded.userId)
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.is_verified
      }
    })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    })
  }
})

// Forgot password - send reset link via email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      })
    }

    // Get user
    const user = await db.getUserByEmail(email)
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email address' 
      })
    }

    // Generate secure reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    // Send reset link via email
    try {
      await emailService.sendPasswordResetEmail(email, user.name, resetToken)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send email. Please try again.' 
      })
    }

    res.json({ 
      success: true, 
      message: 'Password reset link has been sent to your email address.' 
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password' 
    })
  }
})

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      })
    }

    // Verify reset token
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await db.getUserById(decoded.userId)
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset token' 
      })
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await db.updateUser(user.id, { password_hash: passwordHash })

    res.json({ 
      success: true, 
      message: 'Password has been reset successfully.' 
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(400).json({ 
      success: false, 
      message: 'Invalid or expired reset token' 
    })
  }
})

export default router
