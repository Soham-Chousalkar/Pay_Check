import express from 'express'
import { TursoAdapter } from '../database/TursoAdapter.js'

const router = express.Router()
const db = new TursoAdapter()

// Get all canvases for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const canvases = await db.getCanvasesByUserId(userId)
    res.json({ success: true, data: canvases })
  } catch (error) {
    console.error('Get canvases error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch canvases' })
  }
})

// Create a new canvas
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { title, data } = req.body
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' })
    }

    const canvasId = `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Create canvas in database
    await db.createCanvas({
      id: canvasId,
      user_id: userId,
      title,
      data: data || {}
    })

    res.json({ 
      success: true, 
      data: { id: canvasId, title, data: data || {}, created_at: new Date().toISOString() }
    })
  } catch (error) {
    console.error('Create canvas error:', error)
    res.status(500).json({ success: false, message: 'Failed to create canvas' })
  }
})

// Update a canvas
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id } = req.params
    const { title, data } = req.body

    const result = await db.updateCanvas(id, userId, { title, data: data || {} })

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Canvas not found' })
    }

    res.json({ success: true, data: { id, title, data: data || {} } })
  } catch (error) {
    console.error('Update canvas error:', error)
    res.status(500).json({ success: false, message: 'Failed to update canvas' })
  }
})

// Delete a canvas
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id } = req.params

    const result = await db.deleteCanvas(id, userId)

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Canvas not found' })
    }

    res.json({ success: true, message: 'Canvas deleted successfully' })
  } catch (error) {
    console.error('Delete canvas error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete canvas' })
  }
})

export default router










