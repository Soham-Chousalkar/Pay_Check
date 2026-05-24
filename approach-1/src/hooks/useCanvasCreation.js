import { useCallback } from 'react'
import { PANEL_WIDTH, PANEL_HEIGHT } from '../utils/panelUtils'

export function useCanvasCreation(canvases, setCanvases, activeCanvasId, setActiveCanvasId, panels, setPanels, addToHistory, logDebug) {
  const createNewCanvas = useCallback(() => {
    // Record history BEFORE creating the canvas
    const prevCanvases = [...canvases]
    const prevActiveCanvasId = activeCanvasId
    const prevPanels = [...panels]

    const x = Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2)
    const y = Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2)
    const newPanelId = `panel-${Date.now()}`
    const newPanel = { id: newPanelId, x, y, title: 'PayTracker', state: undefined }
    const canvasId = `canvas-${Date.now() + Math.random()}`
    const newCanvas = {
      id: canvasId,
      name: `Canvas ${canvases.length + 1}`,
      panels: [newPanel],
      lastSnapshotAt: Date.now()
    }

    // Record history for canvas creation
    if (addToHistory) {
      addToHistory(
        'CREATE_CANVAS',
        {
          canvases: prevCanvases,
          activeCanvasId: prevActiveCanvasId,
          panels: prevPanels
        },
        {
          canvases: [...prevCanvases, newCanvas],
          activeCanvasId: canvasId,
          panels: [newPanel]
        },
        (state) => {
          // Restore the state properly
          setCanvases(state.canvases)
          if (state.activeCanvasId) {
            setActiveCanvasId(state.activeCanvasId)
          }
          if (state.panels) {
            setPanels(state.panels)
          }
        }
      )
    }

    // Update state
    setCanvases(prev => [...prev, newCanvas])
    setActiveCanvasId(canvasId)
    setPanels([newPanel])

    // Log debug info
    logDebug('CREATE_CANVAS', `New canvas ${canvasId} created with panel ${newPanelId}`)
  }, [canvases, setCanvases, activeCanvasId, setActiveCanvasId, panels, setPanels, addToHistory, logDebug])

  return { createNewCanvas }
}

