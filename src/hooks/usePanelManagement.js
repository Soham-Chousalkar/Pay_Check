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
    
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, ...pos } : p)));
  }, [setPanels, panels, addToHistory]);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback(() => {
    setIsDraggingAny(true);
  }, []);

  /**
   * Handle drag end - includes snapping logic
   */
  const handleDragEnd = useCallback((id) => {
    setIsDraggingAny(false);
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
  }, [setPanels]);

  /**
   * Add a panel adjacent to another panel
   */
  const handleAddPanel = useCallback((panelId, side, neighborId) => {
    const base = panels.find(p => p.id === panelId);
    if (!base) return;
    
    if (neighborId) {
      const neighbor = panels.find(p => p.id === neighborId);
      if (!neighbor) return;
      
      // Insert between panels
      const seamX = (base.x + PANEL_WIDTH + neighbor.x) / 2;
      const seamY = (base.y + PANEL_HEIGHT + neighbor.y) / 2;
      
      // Collect groups by BFS over stuck edges along axis
      const visited = new Set();
      const adjH = new Map();
      const adjV = new Map();
      
      for (const a of panels) {
        adjH.set(a.id, []);
        adjV.set(a.id, []);
      }
      
      for (let i = 0; i < panels.length; i++) {
        for (let j = i + 1; j < panels.length; j++) {
          const a = panels[i], b = panels[j];
          if (isStuckHorizontal(a, b)) { adjH.get(a.id).push(b.id); adjH.get(b.id).push(a.id); }
          if (isStuckVertical(a, b)) { adjV.get(a.id).push(b.id); adjV.get(b.id).push(a.id); }
        }
      }
      
      const useH = side === 'left' || side === 'right';
      const graph = useH ? adjH : adjV;
      
      const bfs = (startId) => {
        const q = [startId];
        const res = new Set([startId]);
        while (q.length) {
          const cur = q.shift();
          for (const nb of graph.get(cur) || []) {
            if (!res.has(nb)) { res.add(nb); q.push(nb); }
          }
        }
        return res;
      };
      
      const leftSet = bfs(base.id);
      const rightSet = bfs(neighbor.id);
  
      const leftArr = panels.filter(p => leftSet.has(p.id));
      const rightArr = panels.filter(p => rightSet.has(p.id));
  
      const leftSize = leftArr.length;
      const rightSize = rightArr.length;
      const denom = Math.max(1, leftSize + rightSize);
      const deltaLeft = (useH ? PANEL_WIDTH : PANEL_HEIGHT) * (rightSize / denom);
      const deltaRight = (useH ? PANEL_WIDTH : PANEL_HEIGHT) * (leftSize / denom);
  
      // Apply proposed shifts
      let next = panels.map(p => ({ ...p }));
      if (useH) {
        for (const p of next) {
          if (leftSet.has(p.id)) p.x = Math.max(0, p.x - deltaLeft);
          if (rightSet.has(p.id)) p.x = p.x + deltaRight;
        }
      } else {
        for (const p of next) {
          if (leftSet.has(p.id)) p.y = Math.max(0, p.y - deltaLeft);
          if (rightSet.has(p.id)) p.y = p.y + deltaRight;
        }
      }
  
      // Resolve overlaps by pushing further outward from seam
      const seamLine = useH ? seamX : seamY;
      let guard = 0;
      const sideOf = (p) => useH ? (p.x + PANEL_WIDTH / 2 <= seamLine ? 'left' : 'right') : (p.y + PANEL_HEIGHT / 2 <= seamLine ? 'left' : 'right');
      
      while (guard < 200) {
        guard += 1;
        let fixedAny = false;
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i], b = next[j];
            if (!rectsOverlap(a, b)) continue;
            const sideA = sideOf(a); const sideB = sideOf(b);
            const move = PANEL_GAP;
            if (useH) {
              if (sideA === 'left' && sideB !== 'left') { a.x = Math.max(0, a.x - move); fixedAny = true; }
              else if (sideB === 'left' && sideA !== 'left') { b.x = Math.max(0, b.x - move); fixedAny = true; }
              else if (sideA === 'right') { a.x = a.x + move; fixedAny = true; }
              else if (sideB === 'right') { b.x = b.x + move; fixedAny = true; }
            } else {
              if (sideA === 'left' && sideB !== 'left') { a.y = Math.max(0, a.y - move); fixedAny = true; }
              else if (sideB === 'left' && sideA !== 'left') { b.y = Math.max(0, b.y - move); fixedAny = true; }
              else if (sideA === 'right') { a.y = a.y + move; fixedAny = true; }
              else if (sideB === 'right') { b.y = b.y + move; fixedAny = true; }
            }
          }
        }
        if (!fixedAny) break;
      }
  
      // Finally, place new panel at seam
      const newPanel = { id: `panel-${Date.now()}`, x: base.x, y: base.y, title: 'PayTracker' };
      if (useH) {
        newPanel.x = neighbor.x - PANEL_GAP - PANEL_WIDTH;
        newPanel.y = (Math.max(base.y, neighbor.y) + Math.min(base.y + PANEL_HEIGHT, neighbor.y + PANEL_HEIGHT)) / 2 - PANEL_HEIGHT / 2;
      } else {
        newPanel.y = neighbor.y - PANEL_GAP - PANEL_HEIGHT;
        newPanel.x = (Math.max(base.x, neighbor.x) + Math.min(base.x + PANEL_WIDTH, neighbor.x + PANEL_WIDTH)) / 2 - PANEL_WIDTH / 2;
      }
  
      next.push(newPanel);
      
      // Record history for adding panel
      if (addToHistory) {
        const prevPanels = [...panels];
        
        addToHistory(
          'ADD_PANEL',
          { panels: prevPanels },
          { panels: next },
          (state) => setPanels(state.panels)
        );
      }
      
      setPanels(next);
      return;
    }
    
    // Default adjacent add
    // Get current panels before update
    const prevPanels = [...panels];
    
    setPanels((prev) => {
      const baseNow = prev.find((p) => p.id === panelId);
      if (!baseNow) return prev;
      
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
  }, [panels, setPanels]);

  /**
   * Handle panel state changes from EarningsPanel
   */
  const handlePanelStateChange = useCallback((panelId, state) => {
    // Get current panels before update
    const prevPanels = [...panels];
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
