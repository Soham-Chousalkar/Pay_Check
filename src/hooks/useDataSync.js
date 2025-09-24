import { useState, useEffect, useCallback } from 'react'
import { canvasService, panelService, counterService, preferencesService } from '../services/databaseService'

// Feature flag to suppress DB usage in dev/anonymous mode
const DB_ENABLED = false

export const useDataSync = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load user data from Turso
  const loadUserData = useCallback(async () => {
    if (!DB_ENABLED) {
      return []
    }
    try {
      setLoading(true)
      setError(null)
      const canvases = await canvasService.getAll()
      const canvasesWithPanels = await Promise.all(
        canvases.map(async (canvas) => {
          const panels = await panelService.getByCanvasId(canvas.id)
          const counter = await counterService.getByCanvasId(canvas.id)
          return {
            ...canvas,
            panels: panels || [],
            counter: counter?.value || 0
          }
        })
      )
      return canvasesWithPanels
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Save canvas data
  const saveCanvas = useCallback(async (canvasData) => {
    if (!DB_ENABLED) {
      return null
    }
    try {
      setError(null)
      if (canvasData.id && canvasData.id.startsWith('canvas-')) {
        const canvas = await canvasService.create(canvasData.name, {
          panels: canvasData.panels,
          lastSnapshotAt: canvasData.lastSnapshotAt
        })
        if (canvasData.panels.length > 0) {
          await Promise.all(
            canvasData.panels.map(panel => panelService.create(canvas.id, panel))
          )
        }
        if (canvasData.counter !== undefined) {
          await counterService.create(canvas.id, canvasData.counter)
        }
        return canvas
      } else {
        const canvas = await canvasService.update(canvasData.id, {
          title: canvasData.name,
          data: {
            panels: canvasData.panels,
            lastSnapshotAt: canvasData.lastSnapshotAt
          }
        })
        await panelService.deleteByCanvasId(canvasData.id)
        if (canvasData.panels.length > 0) {
          await Promise.all(
            canvasData.panels.map(panel => panelService.create(canvasData.id, panel))
          )
        }
        await counterService.update(canvasData.id, canvasData.counter || 0)
        return canvas
      }
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  // Save preferences
  const savePreferences = useCallback(async (settings) => {
    if (!DB_ENABLED) {
      return null
    }
    try {
      setError(null)
      const preferences = await preferencesService.update(settings)
      return preferences
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  // Delete canvas
  const deleteCanvas = useCallback(async (canvasId) => {
    if (!DB_ENABLED) {
      return false
    }
    try {
      setError(null)
      await canvasService.delete(canvasId)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    loadUserData,
    saveCanvas,
    savePreferences,
    deleteCanvas,
    clearError
  }
}




