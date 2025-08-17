import { useState, useCallback } from 'react';

/**
 * Custom hook for managing application history for undo/redo functionality
 * @param {number} maxHistoryLength - Maximum number of history entries to keep
 * @returns {object} - History management functions and state
 */
export function useHistory(maxHistoryLength = 50) {
  // Stack of previous states
  const [past, setPast] = useState([]);
  
  // Stack of undone states that can be redone
  const [future, setFuture] = useState([]);
  
  // Whether we're currently performing an undo/redo operation
  const [isUndoRedoing, setIsUndoRedoing] = useState(false);
  
  /**
   * Add a new action to the history
   * @param {string} actionType - Type of action performed
   * @param {object} prevState - Previous state
   * @param {object} nextState - New state after action
   * @param {function} restoreFunc - Function to call to restore the state
   */
  const addToHistory = useCallback((actionType, prevState, nextState, restoreFunc) => {
    if (isUndoRedoing) return; // Don't record history during undo/redo operations
    
    // Create history entry
    const historyEntry = {
      actionType,
      prevState,
      nextState,
      timestamp: Date.now(),
      restoreFunc
    };
    
    // Use setTimeout to break potential update cycles
    setTimeout(() => {
      // Add to history stack, enforcing max length
      setPast(prev => {
        const newPast = [...prev, historyEntry];
        if (newPast.length > maxHistoryLength) {
          return newPast.slice(newPast.length - maxHistoryLength);
        }
        return newPast;
      });
      
      // Clear redo stack when a new action is performed
      setFuture([]);
    }, 0);
  }, [isUndoRedoing, maxHistoryLength]);
  
  /**
   * Undo the last action
   */
  const undo = useCallback(() => {
    if (past.length === 0) return;
    
    setIsUndoRedoing(true);
    
    // Get the last action from history
    const lastAction = past[past.length - 1];
    
    // Restore the previous state
    lastAction.restoreFunc(lastAction.prevState);
    
    // Update history stacks
    setPast(prev => prev.slice(0, prev.length - 1));
    setFuture(prev => [lastAction, ...prev]);
    
    // Small delay to ensure state is updated before allowing new history entries
    setTimeout(() => setIsUndoRedoing(false), 50);
  }, [past]);
  
  /**
   * Redo the last undone action
   */
  const redo = useCallback(() => {
    if (future.length === 0) return;
    
    setIsUndoRedoing(true);
    
    // Get the most recent undone action
    const nextAction = future[0];
    
    // Restore the state that was undone
    nextAction.restoreFunc(nextAction.nextState);
    
    // Update history stacks
    setFuture(prev => prev.slice(1));
    setPast(prev => [...prev, nextAction]);
    
    // Small delay to ensure state is updated before allowing new history entries
    setTimeout(() => setIsUndoRedoing(false), 50);
  }, [future]);
  
  // Check if undo/redo are available
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  
  return {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    isUndoRedoing,
    historyLength: past.length,
    redoLength: future.length
  };
}

