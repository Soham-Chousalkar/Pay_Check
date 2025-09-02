import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import { initDatabase } from './database/init.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() })
})

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase()
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer()
}

export default app
