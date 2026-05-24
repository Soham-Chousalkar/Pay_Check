import express from 'express'
import { TursoAdapter } from '../database/TursoAdapter.js'

const router = express.Router()
const db = new TursoAdapter()

// Create a new counter
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { canvasId, value = 0 } = req.body
    if (!canvasId) {
      return res.status(400).json({ success: false, message: 'Canvas ID is required' })
    }

    await db.createCounter(canvasId, userId, value)

    res.json({ 
      success: true, 
      data: { canvasId, value, created_at: new Date().toISOString() }
    })
  } catch (error) {
    console.error('Create counter error:', error)
    res.status(500).json({ success: false, message: 'Failed to create counter' })
  }
})

// Get counter by canvas ID
router.get('/canvas/:canvasId', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { canvasId } = req.params
    const counter = await db.getCounterByCanvasId(canvasId, userId)

    res.json({ success: true, data: counter })
  } catch (error) {
    console.error('Get counter error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch counter' })
  }
})

// Update counter
router.put('/canvas/:canvasId', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { canvasId } = req.params
    const { value } = req.body

    if (typeof value !== 'number') {
      return res.status(400).json({ success: false, message: 'Value must be a number' })
    }

    const result = await db.updateCounter(canvasId, userId, value)

    if (result.rowsAffected === 0) {
      // Counter doesn't exist, create it
      await db.createCounter(canvasId, userId, value)
    }

    res.json({ success: true, data: { canvasId, value } })
  } catch (error) {
    console.error('Update counter error:', error)
    res.status(500).json({ success: false, message: 'Failed to update counter' })
  }
})

export default router

