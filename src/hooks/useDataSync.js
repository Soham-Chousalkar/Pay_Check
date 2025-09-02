import { useState, useEffect, useCallback } from 'react'
import { canvasService, panelService, counterService, preferencesService } from '../services/databaseService'

export const useDataSync = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load user data from Turso
  const loadUserData = useCallback(async () => {
    
    try {
      setLoading(true)
      setError(null)
      
      // Load canvases
      const canvases = await canvasService.getAll()
      
      // Load panels for each canvas
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
      console.error('Error loading user data:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Save canvas data
  const saveCanvas = useCallback(async (canvasData) => {
    
    try {
      setError(null)
      
      if (canvasData.id && canvasData.id.startsWith('canvas-')) {
        // New canvas, create in database
        const canvas = await canvasService.create(canvasData.name, {
          panels: canvasData.panels,
          lastSnapshotAt: canvasData.lastSnapshotAt
        })
        
        // Save panels
        if (canvasData.panels.length > 0) {
          await Promise.all(
            canvasData.panels.map(panel => 
              panelService.create(canvas.id, panel)
            )
          )
        }
        
        // Save counter
        if (canvasData.counter !== undefined) {
          await counterService.create(canvas.id, canvasData.counter)
        }
        
        return canvas
      } else {
        // Existing canvas, update in database
        const canvas = await canvasService.update(canvasData.id, {
          title: canvasData.name,
          data: {
            panels: canvasData.panels,
            lastSnapshotAt: canvasData.lastSnapshotAt
          }
        })
        
        // Update panels
        await panelService.deleteByCanvasId(canvasData.id)
        if (canvasData.panels.length > 0) {
          await Promise.all(
            canvasData.panels.map(panel => 
              panelService.create(canvasData.id, panel)
            )
          )
        }
        
        // Update counter
        await counterService.update(canvasData.id, canvasData.counter || 0)
        
        return canvas
      }
    } catch (err) {
      setError(err.message)
      console.error('Error saving canvas:', err)
      return null
    }
  }, [])

  // Save preferences
  const savePreferences = useCallback(async (settings) => {
    
    try {
      setError(null)
      const preferences = await preferencesService.update(settings)
      return preferences
    } catch (err) {
      setError(err.message)
      console.error('Error saving preferences:', err)
      return null
    }
  }, [])

  // Delete canvas
  const deleteCanvas = useCallback(async (canvasId) => {
    
    try {
      setError(null)
      await canvasService.delete(canvasId)
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error deleting canvas:', err)
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




