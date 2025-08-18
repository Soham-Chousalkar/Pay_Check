import { useState, useCallback } from 'react';
import { 
  PANEL_WIDTH, 
  PANEL_HEIGHT, 
  PANEL_GAP,
  STICK_THRESHOLD,
  isStuckHorizontal,
  isStuckVertical,
  rectsOverlap,
  verticalOverlapAmount,
  horizontalOverlapAmount
} from '../utils/panelUtils';

/**
 * Custom hook for managing panel operations
 */
export function usePanelManagement(panels, setPanels, addToHistory = null) {
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [previewPanel, setPreviewPanel] = useState(null);
  const [dragStartPositions, setDragStartPositions] = useState({}); // Track drag start positions

  /**
   * Find a neighbor panel on a specific side
   */
  const findNeighborOnSide = useCallback((base, side) => {
    let candidate = null;
    for (const other of panels) {
      if (other.id === base.id) continue;
      
      if ((side === 'right' || side === 'left') && isStuckHorizontal(base, other)) {
        const isRight = Math.abs((base.x + PANEL_WIDTH + PANEL_GAP) - other.x) <= 2;
        const isLeft = Math.abs((other.x + PANEL_WIDTH + PANEL_GAP) - base.x) <= 2;
        if ((side === 'right' && isRight) || (side === 'left' && isLeft)) { 
          candidate = other; 
          break; 
        }
      }
      
      if ((side === 'top' || side === 'bottom') && isStuckVertical(base, other)) {
        const isBottom = Math.abs((base.y + PANEL_HEIGHT + PANEL_GAP) - other.y) <= 2;
        const isTop = Math.abs((other.y + PANEL_HEIGHT + PANEL_GAP) - base.y) <= 2;
        if ((side === 'bottom' && isBottom) || (side === 'top' && isTop)) { 
          candidate = other; 
          break; 
        }
      }
    }
    return candidate;
  }, [panels]);

  /**
   * Check if there's space for a new panel
   */
  const hasSpaceForPanel = useCallback((panelId, side) => {
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return false;
    
    // Calculate the position where the new panel would be placed
    let newX = panel.x;
    let newY = panel.y;
    
    if (side === 'right') newX = panel.x + PANEL_WIDTH + PANEL_GAP;
    if (side === 'left') newX = panel.x - PANEL_WIDTH - PANEL_GAP;
    if (side === 'bottom') newY = panel.y + PANEL_HEIGHT + PANEL_GAP;
    if (side === 'top') newY = panel.y - PANEL_HEIGHT - PANEL_GAP;
    
    // Check if new position would be off-screen
    if (newX < 0 || newY < 0) return false;
    
    // Check if new position would overlap with existing panels
    const wouldOverlap = panels.some(p => {
      if (p.id === panelId) return false; // Skip the panel itself
      
      // Simple box collision detection
      const overlap = !(
        newX + PANEL_WIDTH <= p.x || 
        p.x + PANEL_WIDTH <= newX || 
        newY + PANEL_HEIGHT <= p.y || 
        p.y + PANEL_HEIGHT <= newY
      );
      
      return overlap;
    });
    
    return !wouldOverlap;
  }, [panels]);

  /**
   * Show preview panel when hovering over the plus button
   */
  const handlePlusMouseEnter = useCallback((panelId, side) => {
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;
    
    let x = panel.x;
    let y = panel.y;
    
    if (side === 'right') x = panel.x + PANEL_WIDTH + PANEL_GAP;
    if (side === 'left') x = panel.x - PANEL_WIDTH - PANEL_GAP;
    if (side === 'bottom') y = panel.y + PANEL_HEIGHT + PANEL_GAP;
    if (side === 'top') y = panel.y - PANEL_HEIGHT - PANEL_GAP;
    
    setPreviewPanel({
      x,
      y,
      panelId,
      side
    });
  }, [panels]);
  
  /**
   * Hide preview panel when leaving the plus button
   */
  const handlePlusMouseLeave = useCallback(() => {
    setPreviewPanel(null);
  }, []);

  /**
   * Handle panel dragging
   */
  const handleDrag = useCallback((id, pos) => {
    // Save previous state for history
    if (addToHistory) {
      const prevPanels = [...panels];
      const updatedPanels = prevPanels.map(p => p.id === id ? { ...p, ...pos } : p);
      
      addToHistory(
        'MOVE_PANEL',
        { panels: prevPanels },
        { panels: updatedPanels },
        (state) => setPanels(state.panels)
      );
    }
    
    // Log debug info for significant moves
    const panel = panels.find(p => p.id === id);
    if (panel && (Math.abs(panel.x - pos.x) > 5 || Math.abs(panel.y - pos.y) > 5)) {
  
    }
    
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, ...pos } : p)));
  }, [setPanels, panels, addToHistory]);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((id, pos) => {
    setIsDraggingAny(true);
    setDragStartPositions(prev => ({ ...prev, [id]: pos }));
  }, []);

  /**
   * Handle drag end - includes snapping logic
   */
  const handleDragEnd = useCallback((id) => {
    setIsDraggingAny(false);
    
    // Get the final position and calculate movement
    const finalPanel = panels.find(p => p.id === id);
    const startPos = dragStartPositions[id];
    
    if (finalPanel && startPos) {
      const deltaX = finalPanel.x - startPos.x;
      const deltaY = finalPanel.y - startPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > 5) { // Only log significant movements
    
      }
      
      // Clear the start position
      setDragStartPositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[id];
        return newPositions;
      });
    }
    
    setPanels((prev) => {
      const me = prev.find(p => p.id === id);
      if (!me) return prev;
      
      let snapX = me.x;
      let snapY = me.y;
      let didSnap = false;
      
      for (const other of prev) {
        if (other.id === id) continue;
        
        const vertOverlap = !(me.y + PANEL_HEIGHT < other.y || other.y + PANEL_HEIGHT < me.y);
        if (vertOverlap) {
          if (Math.abs((me.x + PANEL_WIDTH) - other.x) <= STICK_THRESHOLD) {
            snapX = other.x - PANEL_WIDTH - PANEL_GAP; 
            didSnap = true;
          } else if (Math.abs(me.x - (other.x + PANEL_WIDTH)) <= STICK_THRESHOLD) {
            snapX = other.x + PANEL_WIDTH + PANEL_GAP; 
            didSnap = true;
          }
        }
        
        const horizOverlap = !(me.x + PANEL_WIDTH < other.x || other.x + PANEL_WIDTH < me.x);
        if (horizOverlap) {
          if (Math.abs((me.y + PANEL_HEIGHT) - other.y) <= STICK_THRESHOLD) {
            snapY = other.y - PANEL_HEIGHT - PANEL_GAP; 
            didSnap = true;
          } else if (Math.abs(me.y - (other.y + PANEL_HEIGHT)) <= STICK_THRESHOLD) {
            snapY = other.y + PANEL_HEIGHT + PANEL_GAP; 
            didSnap = true;
          }
        }
      }
      
      if (!didSnap) return prev;
      return prev.map(p => p.id === id ? { ...p, x: snapX, y: snapY } : p);
    });
  }, [setPanels, panels, dragStartPositions]);

  /**
   * Add a panel adjacent to another panel
   */
  const handleAddPanel = useCallback((panelId, side, neighborId) => {
    const base = panels.find(p => p.id === panelId);
    if (!base) {
      return;
    }
    
    // Get current panels before update
    const prevPanels = [...panels];
    
    setPanels((prev) => {
      const baseNow = prev.find((p) => p.id === panelId);
      if (!baseNow) {
        return prev;
      }
      
      let x = baseNow.x;
      let y = baseNow.y;
      
      if (side === 'right') x = baseNow.x + PANEL_WIDTH + PANEL_GAP;
      if (side === 'left') x = Math.max(0, baseNow.x - PANEL_WIDTH - PANEL_GAP);
      if (side === 'bottom') y = baseNow.y + PANEL_HEIGHT + PANEL_GAP;
      if (side === 'top') y = Math.max(0, baseNow.y - PANEL_HEIGHT - PANEL_GAP);
      
      const newPanel = { id: `panel-${Date.now()}`, x, y, title: 'PayTracker' };
      const nextPanels = [...prev, newPanel];
      

      
      // Record history for adding panel
      if (addToHistory) {
        addToHistory(
          'ADD_PANEL',
          { panels: prevPanels },
          { panels: nextPanels },
          (state) => setPanels(state.panels)
        );
      }
      
      return nextPanels;
    });
  }, [panels, setPanels, addToHistory]);

  /**
   * Handle panel state changes from EarningsPanel
   */
  const handlePanelStateChange = useCallback((panelId, state) => {
    // Get current panels before update
    const prevPanels = [...panels];
    const currentPanel = prevPanels.find(p => p.id === panelId);
    
    // Check if state has actually changed to prevent unnecessary updates
    if (currentPanel && currentPanel.state && JSON.stringify(currentPanel.state) === JSON.stringify(state)) {
      return; // No change, don't update
    }
    
    const nextPanels = prevPanels.map(p => p.id === panelId ? { ...p, state } : p);
    

    
    // Record history for state change but only if not already in an undo/redo operation
    if (addToHistory) {
      // Use setTimeout to break the potential update cycle
      setTimeout(() => {
        addToHistory(
          'UPDATE_PANEL',
          { panels: prevPanels },
          { panels: nextPanels },
          (state) => setPanels(state.panels)
        );
      }, 0);
    }
    
    setPanels(nextPanels);
  }, [setPanels, panels, addToHistory]);

  return {
    isDraggingAny,
    previewPanel,
    findNeighborOnSide,
    hasSpaceForPanel,
    handlePlusMouseEnter,
    handlePlusMouseLeave,
    handleDrag,
    handleDragStart,
    handleDragEnd,
    handleAddPanel,
    handlePanelStateChange
  };
}
