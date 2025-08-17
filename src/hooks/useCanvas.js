import { useState, useEffect } from 'react';
import { PANEL_WIDTH, PANEL_HEIGHT } from '../utils/panelUtils';

/**
 * Custom hook for managing canvases and panels
 */
export function useCanvas() {
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
    console.log('Initializing first panel:', firstPanel);
    console.log('Initializing first canvas:', firstCanvas);
    setCanvases([firstCanvas]);
    setActiveCanvasId(firstCanvas.id);
    setPanels(firstCanvas.panels);
  }, []);

  // Keep active canvas panels in sync with local in-memory canvases list
  useEffect(() => {
    if (!activeCanvasId) return;
    setCanvases((prev) => prev.map(c => c.id === activeCanvasId ? { ...c, panels: panels } : c));
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
    setShowCanvasLibrary(false);
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
    setShowCanvasLibrary(false);
  };

  const deleteCanvas = (canvasId) => {
    if (!window.confirm('Delete this canvas?')) return;
    
    setCanvases(prev => {
      const filtered = prev.filter(c => c.id !== canvasId);
      
      if (filtered.length === 0) {
        // create a fresh one
        const x = Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2);
        const y = Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2);
        const fresh = { 
          id: `canvas-${Date.now()}`, 
          name: 'Canvas 1', 
          panels: [{ id: `panel-${Date.now()}`, x, y, title: 'PayTracker' }], 
          lastSnapshotAt: Date.now() 
        };
        setActiveCanvasId(fresh.id);
        setPanels(fresh.panels);
        return [fresh];
      }
      
      const nextActive = filtered[0];
      setActiveCanvasId(nextActive.id);
      setPanels(nextActive.panels);
      return filtered;
    });
    
    setShowCanvasLibrary(false);
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
