import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import authRoutes from './routes/auth.js'
import canvasRoutes from './routes/canvases.js'
import panelRoutes from './routes/panels.js'
import preferenceRoutes from './routes/preferences.js'
import counterRoutes from './routes/counters.js'
import { initDatabase } from './database/init.js'
import { errorHandler } from './middleware/errorHandler.js'
import { validateInput } from './middleware/validation.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Port handling will be done in startServer function
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.error('JWT_SECRET environment variable is required!')
  process.exit(1)
})()

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL] 
  : ['http://localhost:3000', 'http://127.0.0.1:3000']

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))

app.use(validateInput)

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' })
    }
    req.user = { id: decoded.userId, email: decoded.email }
    next()
  })
}

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/canvases', authenticateToken, canvasRoutes)
app.use('/api/panels', authenticateToken, panelRoutes)
app.use('/api/preferences', authenticateToken, preferenceRoutes)
app.use('/api/counters', authenticateToken, counterRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: Date.now(),
    database: 'connected',
    version: '1.0.0'
  })
})

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase()
    
    // Find available port starting from 3001
    const findAvailablePort = async (startPort) => {
      const net = await import('net')
      return new Promise((resolve, reject) => {
        const server = net.createServer()
        server.listen(startPort, () => {
          const port = server.address().port
          server.close(() => resolve(port))
        })
        server.on('error', () => {
          resolve(findAvailablePort(startPort + 1))
        })
      })
    }
    
    const availablePort = await findAvailablePort(PORT)
    const server = app.listen(availablePort, () => {
      console.log(`Backend server running on port ${availablePort}`)
    })
    
    server.on('error', (err) => {
      console.error('Server error:', err)
      process.exit(1)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Error handler middleware
app.use(errorHandler)

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer()
}

export default app
