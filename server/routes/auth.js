import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { TursoAdapter } from '../database/TursoAdapter.js'
import { emailService } from '../services/emailService.js'

const router = express.Router()
const db = new TursoAdapter()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

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

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
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

// Forgot password - send current password via email
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

    // Generate a new password and update user
    const newPassword = generatePassword()
    const passwordHash = await bcrypt.hash(newPassword, 10)
    
    await db.updateUser(user.id, { password_hash: passwordHash })

    // Send password via email
    try {
      await emailService.sendPasswordResetEmail(email, user.name, newPassword)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send email. Please try again.' 
      })
    }

    res.json({ 
      success: true, 
      message: 'Your new password has been sent to your email address.' 
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password' 
    })
  }
})

export default router
