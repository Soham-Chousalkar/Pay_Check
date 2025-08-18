import { useState, useEffect, useRef } from 'react';
import { PANEL_WIDTH, PANEL_HEIGHT } from '../utils/panelUtils';

/**
 * Custom hook for managing canvases and panels
 */
export function useCanvas(addToHistory = null) {
  const [canvases, setCanvases] = useState([]);
  const [activeCanvasId, setActiveCanvasId] = useState(null);
  const [panels, setPanels] = useState([]);
  const [showCanvasLibrary, setShowCanvasLibrary] = useState(false);
  const [editingCanvasId, setEditingCanvasId] = useState(null);
  const [editingCanvasName, setEditingCanvasName] = useState("");

  // Initialize the first canvas
  useEffect(() => {
    const x = Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2);
    const y = Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2);
    const firstPanel = { id: `panel-${Date.now()}`, x, y, title: 'PayTracker', state: undefined };
    const firstCanvas = { id: `canvas-${Date.now()}`, name: 'Canvas 1', panels: [firstPanel], lastSnapshotAt: Date.now() };
    // Removed console logs for performance
    setCanvases([firstCanvas]);
    setActiveCanvasId(firstCanvas.id);
    setPanels(firstCanvas.panels);
  }, []);

  // Keep active canvas panels in sync with local in-memory canvases list
  const activePanelsRef = useRef(null);
  
  useEffect(() => {
    if (!activeCanvasId || !panels) return;
    
    // Use a ref to track when panels change to avoid circular updates
    const panelsStringified = JSON.stringify(panels);
    
    // Only update if the panels have actually changed significantly
    if (activePanelsRef.current !== panelsStringified) {
      activePanelsRef.current = panelsStringified;
      
      // Use setTimeout to break the update cycle
      const timeoutId = setTimeout(() => {
        setCanvases((prev) => prev.map(c => 
          c.id === activeCanvasId ? { ...c, panels: panels } : c
        ));
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [panels, activeCanvasId]);

  const snapshotActiveCanvas = () => {
    setCanvases(prev => prev.map(c => 
      c.id === activeCanvasId 
        ? { ...c, panels: panels, lastSnapshotAt: Date.now() } 
        : c
    ));
  };

  const openCanvas = (canvasId) => {
    if (canvasId === activeCanvasId) return;
    

    
    // snapshot current
    snapshotActiveCanvas();
    
    // load target and adjust running panels to include elapsed since last snapshot
    const target = canvases.find(c => c.id === canvasId);
    if (!target) return;
    
    const now = Date.now();
    const deltaSec = Math.max(0, (now - (target.lastSnapshotAt || now)) / 1000);
    
    const adjustedPanels = target.panels.map(p => {
      if (!p.state) return p;
      if (p.state.isRunning) {
        return { 
          ...p, 
          state: { 
            ...p.state, 
            accumulatedSeconds: (p.state.accumulatedSeconds || 0) + deltaSec 
          } 
        };
      }
      return p;
    });
    
    setActiveCanvasId(canvasId);
    setPanels(adjustedPanels);
    // Canvas library stays open for multiple operations
  };

  const createNewCanvas = () => {

    
    snapshotActiveCanvas();
    const x = Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2);
    const y = Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2);
    const newPanel = { id: `panel-${Date.now()}`, x, y, title: 'PayTracker', state: undefined };
    const newCanvas = { 
      id: `canvas-${Date.now() + Math.random()}`, 
      name: `Canvas ${canvases.length + 1}`, 
      panels: [newPanel], 
      lastSnapshotAt: Date.now() 
    };
    
    setCanvases(prev => [...prev, newCanvas]);
    setActiveCanvasId(newCanvas.id);
    setPanels(newCanvas.panels);
    // Canvas library stays open for multiple operations
  };

  const deleteCanvas = (canvasId) => {
    // Get the canvas being deleted and current state for history
    const canvasToDelete = canvases.find(c => c.id === canvasId);
    const wasActiveCanvas = canvasId === activeCanvasId;
    const prevCanvases = [...canvases];
    const prevActiveCanvasId = activeCanvasId;
    const prevPanels = [...panels];
    
    // Calculate the new state without triggering multiple updates
    const filteredCanvases = prevCanvases.filter(c => c.id !== canvasId);
    let newActiveCanvasId = prevActiveCanvasId;
    let newPanels = prevPanels;
    
    if (filteredCanvases.length === 0) {
      // create a fresh one
      const x = Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2);
      const y = Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2);
      const fresh = { 
        id: `canvas-${Date.now()}`, 
        name: 'Canvas 1', 
        panels: [{ id: `panel-${Date.now()}`, x, y, title: 'PayTracker' }], 
        lastSnapshotAt: Date.now() 
      };
      newActiveCanvasId = fresh.id;
      newPanels = fresh.panels;
      filteredCanvases.push(fresh);
    } else if (wasActiveCanvas) {
      // Switch to another canvas if the deleted one was active
      newActiveCanvasId = filteredCanvases[0].id;
      newPanels = filteredCanvases[0].panels;
    }
    
    // Record history BEFORE making any state changes
    if (addToHistory) {
      addToHistory(
        'DELETE_CANVAS',
        { 
          canvases: prevCanvases, 
          activeCanvasId: prevActiveCanvasId, 
          panels: prevPanels 
        },
        { 
          canvases: filteredCanvases,
          activeCanvasId: newActiveCanvasId,
          panels: newPanels
        },
        (state) => {
          // Restore the state properly
          setCanvases(state.canvases);
          if (state.activeCanvasId) {
            setActiveCanvasId(state.activeCanvasId);
          }
          if (state.panels) {
            setPanels(state.panels);
          }
        }
      );
    }
    
    // Now update all state at once to prevent multiple history entries
    setCanvases(filteredCanvases);
    setActiveCanvasId(newActiveCanvasId);
    setPanels(newPanels);
  };

  return {
    canvases,
    setCanvases,
    activeCanvasId,
    setActiveCanvasId,
    panels,
    setPanels,
    showCanvasLibrary,
    setShowCanvasLibrary,
    editingCanvasId,
    setEditingCanvasId,
    editingCanvasName,
    setEditingCanvasName,
    snapshotActiveCanvas,
    openCanvas,
    createNewCanvas,
    deleteCanvas
  };
}