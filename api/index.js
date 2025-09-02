import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import { initDatabase } from './database/init.js'

dotenv.config()

const app = express()

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://your-app.vercel.app'] : ['http://localhost:3000'],
  credentials: true
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' })
})

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase()
    
    // For Vercel, export the app instead of listening
    if (process.env.NODE_ENV === 'production') {
      return app
    }
    
    // For local development
    const PORT = process.env.PORT || 3001
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Export for Vercel
export default app

// Start server for local development
if (process.env.NODE_ENV !== 'production') {
  startServer()
}
