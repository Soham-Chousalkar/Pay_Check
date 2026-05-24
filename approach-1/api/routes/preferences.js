import express from 'express'
import { TursoAdapter } from '../database/TursoAdapter.js'

const router = express.Router()
const db = new TursoAdapter()

// Get user preferences
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const preferences = await db.getPreferences(userId)

    if (!preferences) {
      return res.json({ success: true, data: {} })
    }

    const settings = JSON.parse(preferences.settings || '{}')
    res.json({ success: true, data: settings })
  } catch (error) {
    console.error('Get preferences error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch preferences' })
  }
})

// Update user preferences
router.put('/', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { settings } = req.body
    if (!settings) {
      return res.status(400).json({ success: false, message: 'Settings are required' })
    }

    await db.updatePreferences(userId, settings)

    res.json({ success: true, data: settings })
  } catch (error) {
    console.error('Update preferences error:', error)
    res.status(500).json({ success: false, message: 'Failed to update preferences' })
  }
})

export default router










