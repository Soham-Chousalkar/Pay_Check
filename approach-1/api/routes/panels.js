import express from 'express'
import { TursoAdapter } from '../database/TursoAdapter.js'

const router = express.Router()
const db = new TursoAdapter()

// Get panels for a canvas
router.get('/canvas/:canvasId', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { canvasId } = req.params

    const panels = await db.getPanelsByCanvasId(canvasId, userId)

    res.json({ success: true, data: panels })
  } catch (error) {
    console.error('Get panels error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch panels' })
  }
})

// Create a panel
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { canvasId, config } = req.body
    if (!canvasId || !config) {
      return res.status(400).json({ success: false, message: 'Canvas ID and config are required' })
    }

    const panelId = `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    await db.createPanel({
      id: panelId,
      canvas_id: canvasId,
      user_id: userId,
      config
    })

    res.json({ 
      success: true, 
      data: { id: panelId, canvas_id: canvasId, config, created_at: new Date().toISOString() }
    })
  } catch (error) {
    console.error('Create panel error:', error)
    res.status(500).json({ success: false, message: 'Failed to create panel' })
  }
})

// Update a panel
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id } = req.params
    const { config } = req.body

    const result = await db.updatePanel(id, userId, { config: config || {} })

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Panel not found' })
    }

    res.json({ success: true, data: { id, config: config || {} } })
  } catch (error) {
    console.error('Update panel error:', error)
    res.status(500).json({ success: false, message: 'Failed to update panel' })
  }
})

// Delete a panel
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id } = req.params

    const result = await db.deletePanel(id, userId)

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Panel not found' })
    }

    res.json({ success: true, message: 'Panel deleted successfully' })
  } catch (error) {
    console.error('Delete panel error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete panel' })
  }
})

// Delete all panels for a canvas
router.delete('/canvas/:canvasId', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { canvasId } = req.params

    await db.deletePanelsByCanvasId(canvasId, userId)

    res.json({ success: true, message: 'Panels deleted successfully' })
  } catch (error) {
    console.error('Delete panels error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete panels' })
  }
})

export default router










