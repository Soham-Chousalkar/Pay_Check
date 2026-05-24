import { useState, useEffect, useCallback } from 'react'
import { canvasService, panelService, counterService, preferencesService } from '../services/databaseService'
import { handleApiError, logError, getErrorMessage, ErrorCodes } from '../utils/errorHandler'

export const useDataSync = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load user data from database only
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if user is authenticated
      if (!localStorage.getItem('authToken')) {
        return []
      }

      const canvases = await canvasService.getAll()
      const canvasesWithPanels = await Promise.all(
        canvases.map(async (canvas) => {
          try {
            const panels = await panelService.getByCanvasId(canvas.id)
            const counter = await counterService.getByCanvasId(canvas.id)
            return {
              ...canvas,
              panels: panels || [],
              counter: counter?.value || 0
            }
          } catch (panelError) {
            logError(panelError, `Loading panels for canvas ${canvas.id}`)
            return {
              ...canvas,
              panels: [],
              counter: 0
            }
          }
        })
      )
      return canvasesWithPanels
    } catch (err) {
      const appError = handleApiError(err)
      logError(appError, 'Loading user data')
      setError(getErrorMessage(appError))
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Save canvas data to database only
  const saveCanvas = useCallback(async (canvasData) => {
    try {
      setError(null)
      
      // Check if user is authenticated
      if (!localStorage.getItem('authToken')) {
        throw new Error('User not authenticated')
      }

      if (canvasData.id && canvasData.id.startsWith('canvas-')) {
        const canvas = await canvasService.create(canvasData.name, {
          panels: canvasData.panels,
          lastSnapshotAt: canvasData.lastSnapshotAt
        })
        
        // Save panels with error handling
        if (canvasData.panels.length > 0) {
          try {
            await Promise.all(
              canvasData.panels.map(panel => panelService.create(canvas.id, panel))
            )
          } catch (panelError) {
            logError(panelError, `Saving panels for canvas ${canvas.id}`)
            // Continue even if panel saving fails
          }
        }
        
        // Save counter with error handling
        if (canvasData.counter !== undefined) {
          try {
            await counterService.create(canvas.id, canvasData.counter)
          } catch (counterError) {
            logError(counterError, `Saving counter for canvas ${canvas.id}`)
            // Continue even if counter saving fails
          }
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
        
        // Update panels with error handling
        try {
          await panelService.deleteByCanvasId(canvasData.id)
          if (canvasData.panels.length > 0) {
            await Promise.all(
              canvasData.panels.map(panel => panelService.create(canvasData.id, panel))
            )
          }
        } catch (panelError) {
          logError(panelError, `Updating panels for canvas ${canvasData.id}`)
        }
        
        // Update counter with error handling
        try {
          await counterService.update(canvasData.id, canvasData.counter || 0)
        } catch (counterError) {
          logError(counterError, `Updating counter for canvas ${canvasData.id}`)
        }
        
        return canvas
      }
    } catch (err) {
      const appError = handleApiError(err)
      logError(appError, 'Saving canvas')
      setError(getErrorMessage(appError))
      return null
    }
  }, [])

  // Save preferences to database only
  const savePreferences = useCallback(async (settings) => {
    try {
      setError(null)
      
      // Check if user is authenticated
      if (!localStorage.getItem('authToken')) {
        throw new Error('User not authenticated')
      }

      const preferences = await preferencesService.update(settings)
      return preferences
    } catch (err) {
      const appError = handleApiError(err)
      logError(appError, 'Saving preferences')
      setError(getErrorMessage(appError))
      return null
    }
  }, [])

  // Delete canvas from database only
  const deleteCanvas = useCallback(async (canvasId) => {
    try {
      setError(null)
      
      // Check if user is authenticated
      if (!localStorage.getItem('authToken')) {
        throw new Error('User not authenticated')
      }

      await canvasService.delete(canvasId)
      return true
    } catch (err) {
      const appError = handleApiError(err)
      logError(appError, `Deleting canvas ${canvasId}`)
      setError(getErrorMessage(appError))
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




