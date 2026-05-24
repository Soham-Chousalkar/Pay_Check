import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PANEL_WIDTH,
  PANEL_HEIGHT,
  EDGE_TRIGGER_RADIUS, 
  EDGE_HYSTERESIS,
  EDGE_LOCK_TIMEOUT,
  THROTTLE_DELAY,
  POSITION_CHANGE_THRESHOLD
} from '../utils/panelUtils';

/**
 * Custom hook for panel edge detection and plus button positioning
 */
export function usePanelEdgeDetection(panels, scale, isDraggingAny, worldRef, findNeighborOnSide) {
  const [plusState, setPlusState] = useState(null); // {panelId, side, x, y, neighborId?}
  const lastPlusStateRef = useRef(null);
  const stablePositionRef = useRef(null);
  const activeTimerRef = useRef(null);
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  
  // Remove debug logging for performance improvement
  // useEffect(() => {

  // }, [panels, plusState]);

  // Track the last locked edge to prevent rapid toggling
  const edgeLockRef = useRef({
    side: null,
    panelId: null,
    lockedUntil: 0
  });
  
  // Track whether the plus button is being clicked
  const plusButtonInteractionRef = useRef({
    isClicking: false,
    protectedUntil: 0
  });

  // Handle edge detection and plus button positioning
  useEffect(() => {
    // Don't reset plus state on every mount
    
    // Ensure we have at least one panel for button detection
    if (panels.length === 0) {
    
      return;
    }
    
    const calculatePlusPosition = (e) => {
      // Store the current mouse position
      const currentMousePos = { x: e.clientX, y: e.clientY };
      
      // Calculate movement delta to detect large movements
      const lastPos = lastMousePositionRef.current;
      const deltaX = lastPos ? Math.abs(currentMousePos.x - lastPos.x) : 0;
      const deltaY = lastPos ? Math.abs(currentMousePos.y - lastPos.y) : 0;
      const largeMoveDetected = deltaX > 15 || deltaY > 15;
      
      lastMousePositionRef.current = currentMousePos;
      
    
      
      // Check if we're interacting with an interactive element
      const isOverPlus = e.target && (e.target.closest && e.target.closest('button.global-plus'));
      const interactive = e.target && (e.target.closest && e.target.closest('input, [contenteditable="true"]'));
      
      // Check if we're in a click protection period
      const now = Date.now();
      const isProtected = plusButtonInteractionRef.current.protectedUntil > now;
      
      if (isOverPlus) {
        // When over the plus button, keep it visible
        return;
      }
      
      // Hide immediately if dragging or clicking panels
      if (isDraggingAny) {
        setPlusState(null);
        lastPlusStateRef.current = null;
        stablePositionRef.current = null;
        if (activeTimerRef.current) {
          clearTimeout(activeTimerRef.current);
          activeTimerRef.current = null;
        }
        return;
      }

      if (!worldRef.current || interactive || isProtected) {
        if (plusState !== null && !activeTimerRef.current) {
          activeTimerRef.current = setTimeout(() => {
            setPlusState(null);
            lastPlusStateRef.current = null;
            stablePositionRef.current = null;
            activeTimerRef.current = null;
          }, 300);
        }
        return;
      }
      
      // Clear any active hide timer since we're moving
      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current);
        activeTimerRef.current = null;
      }
      
      const rect = worldRef.current.getBoundingClientRect();
      const localX = (e.clientX - rect.left) / scale;
      const localY = (e.clientY - rect.top) / scale;
      
      // Check if we're still within the locked edge's panel and side
      const currentTime = Date.now();
      const isLocked = edgeLockRef.current.lockedUntil > currentTime;
      
      // Apply hysteresis: If we already have a plus state, use a larger radius to keep it
      // Use even more hysteresis when the button is being clicked
      const isClickingPlus = plusButtonInteractionRef.current.isClicking;
      
      // Use base radius for initial edge detection (since we increased the constant value)
      let currentRadius = EDGE_TRIGGER_RADIUS;
      
      if (plusState && isClickingPlus) {
        // Only add hysteresis when button is being clicked
        currentRadius += EDGE_HYSTERESIS * 0.8;
      }
      
      // If a large movement was detected and we're not clicking, reduce radius for faster response
      if (largeMoveDetected && !isClickingPlus && !isProtected) {
        currentRadius = Math.max(EDGE_TRIGGER_RADIUS * 1.2, currentRadius * 0.7);
      }
      
    
      
      let best = null; // {panelId, side, dist}
      let bestDist = Infinity;
      
      // First pass - check if we should maintain the current edge due to lock
      if (isLocked && plusState) {
        const lockedPanel = panels.find(p => p.id === edgeLockRef.current.panelId);
        if (lockedPanel) {
          const side = edgeLockRef.current.side;
          let dist;
          let withinBounds = false;
          
          // Calculate distance to the locked edge
          if (side === 'left') {
            dist = Math.abs(localX - lockedPanel.x);
            withinBounds = localY >= lockedPanel.y - currentRadius && 
                          localY <= lockedPanel.y + PANEL_HEIGHT + currentRadius;
          } else if (side === 'right') {
            dist = Math.abs(localX - (lockedPanel.x + PANEL_WIDTH));
            withinBounds = localY >= lockedPanel.y - currentRadius && 
                          localY <= lockedPanel.y + PANEL_HEIGHT + currentRadius;
          } else if (side === 'top') {
            dist = Math.abs(localY - lockedPanel.y);
            withinBounds = localX >= lockedPanel.x - currentRadius && 
                          localX <= lockedPanel.x + PANEL_WIDTH + currentRadius;
          } else if (side === 'bottom') {
            dist = Math.abs(localY - (lockedPanel.y + PANEL_HEIGHT));
            withinBounds = localX >= lockedPanel.x - currentRadius && 
                          localX <= lockedPanel.x + PANEL_WIDTH + currentRadius;
          }
          
          // Use a much larger radius for locked edges to prevent flickering
          const lockRadius = currentRadius * 2;
          
          if (dist !== undefined && dist <= lockRadius && withinBounds) {
            best = { 
              panelId: lockedPanel.id, 
              side: side, 
              dist: dist,
              locked: true
            };
            bestDist = dist;
          }
        }
      }
      
      // Only proceed to check other edges if we don't have a locked edge match
      if (!best) {
        // Second pass - find the best edge
        for (const p of panels) {
          const leftDist = Math.abs(localX - p.x);
          const rightDist = Math.abs(localX - (p.x + PANEL_WIDTH));
          const topDist = Math.abs(localY - p.y);
          const bottomDist = Math.abs(localY - (p.y + PANEL_HEIGHT));
    
          // More generous boundaries for determining if we're near a panel edge
          const withinY = localY >= p.y - currentRadius && localY <= p.y + PANEL_HEIGHT + currentRadius;
          const withinX = localX >= p.x - currentRadius && localX <= p.x + PANEL_WIDTH + currentRadius;
    
          // Only consider edges that are actually close to the mouse
          if (withinY && leftDist <= currentRadius && leftDist < bestDist) {
            best = { panelId: p.id, side: 'left', dist: leftDist };
            bestDist = leftDist;
          }
          
          if (withinY && rightDist <= currentRadius && rightDist < bestDist) {
            best = { panelId: p.id, side: 'right', dist: rightDist };
            bestDist = rightDist;
          }
          
          if (withinX && topDist <= currentRadius && topDist < bestDist) {
            best = { panelId: p.id, side: 'top', dist: topDist };
            bestDist = topDist;
          }
          
          if (withinX && bottomDist <= currentRadius && bottomDist < bestDist) {
            best = { panelId: p.id, side: 'bottom', dist: bottomDist };
            bestDist = bottomDist;
          }
        }
      }
      
      // If we don't have a best candidate but we had a previous position, keep it for stability
      if (!best) {
        if (plusState) {
                      // Be more strict about hiding the button when moving away from an edge
            const currentEdge = plusState.side;
            const currentPanelId = plusState.panelId;
            const currentPanel = panels.find(p => p.id === currentPanelId);
            
            if (currentPanel) {
              let distFromCurrentEdge;
              let withinCurrentBounds = false;
              
              if (currentEdge === 'left') {
                distFromCurrentEdge = Math.abs(localX - currentPanel.x);
                withinCurrentBounds = localY >= currentPanel.y - currentRadius && 
                                     localY <= currentPanel.y + PANEL_HEIGHT + currentRadius;
              } else if (currentEdge === 'right') {
                distFromCurrentEdge = Math.abs(localX - (currentPanel.x + PANEL_WIDTH));
                withinCurrentBounds = localY >= currentPanel.y - currentRadius && 
                                     localY <= currentPanel.y + PANEL_HEIGHT + currentRadius;
              } else if (currentEdge === 'top') {
                distFromCurrentEdge = Math.abs(localY - currentPanel.y);
                withinCurrentBounds = localX >= currentPanel.x - currentRadius && 
                                     localX <= currentPanel.x + PANEL_WIDTH + currentRadius;
              } else if (currentEdge === 'bottom') {
                distFromCurrentEdge = Math.abs(localY - (currentPanel.y + PANEL_HEIGHT));
                withinCurrentBounds = localX >= currentPanel.x - currentRadius && 
                                     localX <= currentPanel.x + PANEL_WIDTH + currentRadius;
              }
              
              // Be more generous with keeping the button visible
              if (distFromCurrentEdge !== undefined && 
                  distFromCurrentEdge <= currentRadius * 2 && 
                  withinCurrentBounds) {
                return;
              }
            }
          
          // If we get here, we're far enough away to hide the button
          if (!activeTimerRef.current) {
            // Hide immediately without delay
            setPlusState(null);
            lastPlusStateRef.current = null;
            stablePositionRef.current = null;
            activeTimerRef.current = null;
          }
        }
        return;
      }
      
      // If we have a best candidate, calculate position
      if (best) {
        const base = panels.find(p => p.id === best.panelId);
        if (!base) return;
        
        const neighbor = findNeighborOnSide(base, best.side);
        let x = base.x + PANEL_WIDTH / 2;
        let y = base.y + PANEL_HEIGHT / 2;
        
        if (neighbor) {
          // Position between stuck panels
          if (best.side === 'left' || best.side === 'right') {
            const baseRight = base.x + PANEL_WIDTH;
            const neighborLeft = neighbor.x;
            x = (baseRight + neighborLeft) / 2;
            const ovTop = Math.max(base.y, neighbor.y);
            const ovBottom = Math.min(base.y + PANEL_HEIGHT, neighbor.y + PANEL_HEIGHT);
            y = (ovTop + ovBottom) / 2;
          } else {
            const baseBottom = base.y + PANEL_HEIGHT;
            const neighborTop = neighbor.y;
            y = (baseBottom + neighborTop) / 2;
            const ovLeft = Math.max(base.x, neighbor.x);
            const ovRight = Math.min(base.x + PANEL_WIDTH, neighbor.x + PANEL_WIDTH);
            x = (ovLeft + ovRight) / 2;
          }
          
          const newState = { 
            panelId: best.panelId, 
            side: best.side, 
            x, 
            y, 
            neighborId: neighbor.id,
            timestamp: Date.now() 
          };
          
          // Only update if position has changed significantly or it's a different edge
          const significantChange = stablePositionRef.current && (
            Math.abs(stablePositionRef.current.x - x) > POSITION_CHANGE_THRESHOLD || 
            Math.abs(stablePositionRef.current.y - y) > POSITION_CHANGE_THRESHOLD
          );
          
          const differentEdge = !stablePositionRef.current || 
                               best.panelId !== stablePositionRef.current.panelId || 
                               best.side !== stablePositionRef.current.side;
          
          if (significantChange || differentEdge || !plusState) {
            stablePositionRef.current = newState;
            
            // If we're changing edges, lock the new edge
            if (differentEdge) {
              edgeLockRef.current = {
                side: best.side,
                panelId: best.panelId,
                lockedUntil: Date.now() + EDGE_LOCK_TIMEOUT
              };
            }
            
            setPlusState(newState);
            lastPlusStateRef.current = newState;
          }
        } else {
          // Position outside selected edge
          if (best.side === 'left') x = base.x - 16;
          if (best.side === 'right') x = base.x + PANEL_WIDTH + 16;
          if (best.side === 'top') y = base.y - 16;
          if (best.side === 'bottom') y = base.y + PANEL_HEIGHT + 16;
          if (best.side === 'left' || best.side === 'right') y = base.y + PANEL_HEIGHT / 2;
          if (best.side === 'top' || best.side === 'bottom') x = base.x + PANEL_WIDTH / 2;
          
          const newState = { 
            panelId: best.panelId, 
            side: best.side, 
            x, 
            y,
            timestamp: Date.now() 
          };
          
          // Only update if position has changed significantly or it's a different edge
          const significantChange = stablePositionRef.current && (
            Math.abs(stablePositionRef.current.x - x) > POSITION_CHANGE_THRESHOLD || 
            Math.abs(stablePositionRef.current.y - y) > POSITION_CHANGE_THRESHOLD
          );
          
          const differentEdge = !stablePositionRef.current || 
                               best.panelId !== stablePositionRef.current.panelId || 
                               best.side !== stablePositionRef.current.side;
          
          if (significantChange || differentEdge || !plusState) {
            stablePositionRef.current = newState;
            
            // If we're changing edges, lock the new edge
            if (differentEdge) {
              edgeLockRef.current = {
                side: best.side,
                panelId: best.panelId,
                lockedUntil: Date.now() + EDGE_LOCK_TIMEOUT
              };
            }
            
            setPlusState(newState);
            lastPlusStateRef.current = newState;
          }
        }
      }
    };
    
    // Use throttling for smoother experience
    let lastCallTime = 0;
    
    const throttledHandleMove = (e) => {
      const now = Date.now();
      if (now - lastCallTime >= THROTTLE_DELAY) {
        lastCallTime = now;
        calculatePlusPosition(e);
      }
    };
    
    const el = worldRef.current;
    if (!el) return;
    el.addEventListener('mousemove', throttledHandleMove);
    
    return () => {
      el.removeEventListener('mousemove', throttledHandleMove);
      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current);
      }
    };
  }, [panels, scale, isDraggingAny, plusState, findNeighborOnSide, worldRef]);

  return {
    plusState,
    setPlusState,
    plusButtonInteractionRef
  };
}
