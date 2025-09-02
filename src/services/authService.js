import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { TursoAdapter } from '../adapters/TursoAdapter.js'
import { emailService } from './emailService.js'

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

export const authService = {
  // Register new user
  async register(name, email, password) {
    try {
      // Check if user already exists
      const existingUser = await db.getUserByEmail(email)
      if (existingUser) {
        throw new Error('User already exists with this email')
      }

      // Hash the provided password
      const passwordHash = await bcrypt.hash(password, 12)
      const userId = generateUserId()

      // Create user
      const user = {
        id: userId,
        email,
        name,
        password_hash: passwordHash,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await db.createUser(user)

      // Send welcome email
      await emailService.sendWelcomeEmail(email, name)

      return { success: true, message: 'Account created successfully. You can now log in.' }
    } catch (error) {
      throw new Error(error.message)
    }
  },

  // Login with email and password
  async login(email, password) {
    try {
      const user = await db.getUserByEmail(email)
      if (!user) {
        throw new Error('Invalid credentials')
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      if (!isValidPassword) {
        throw new Error('Invalid credentials')
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.is_verified
        }
      }
    } catch (error) {
      throw new Error(error.message)
    }
  },

  // Google OAuth login/register
  async googleAuth(googleUser) {
    try {
      let user = await db.getUserByGoogleId(googleUser.id)
      
      if (!user) {
        // Check if user exists with same email
        user = await db.getUserByEmail(googleUser.email)
        if (user) {
          // Update existing user with Google ID
          await db.updateUser(user.id, { google_id: googleUser.id })
        } else {
          // Create new user
          const userId = generateUserId()
          user = {
            id: userId,
            email: googleUser.email,
            name: googleUser.name,
            google_id: googleUser.id,
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          await db.createUser(user)
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.is_verified
        }
      }
    } catch (error) {
      throw new Error(error.message)
    }
  },

  // Verify JWT token
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await db.getUserById(decoded.userId)
      
      if (!user) {
        throw new Error('User not found')
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.is_verified
        }
      }
    } catch (error) {
      throw new Error('Invalid token')
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      return await db.getUserById(userId)
    } catch (error) {
      throw new Error(error.message)
    }
  }
}
