import { useEffect, useRef, useState, useCallback } from "react";
import PanelWrapper from "./components/PanelWrapper";
import DebugWindow from "./components/DebugWindow";
import { PANEL_WIDTH, PANEL_HEIGHT, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from "./utils/panelUtils";
import { useCanvas } from "./hooks/useCanvas";
import { usePanelManagement } from "./hooks/usePanelManagement";
import { usePanelEdgeDetection } from "./hooks/usePanelEdgeDetection";
import { useHistory } from "./hooks/useHistory";

/**
 * Main App component - PayTracker
 */
export default function App() {
  // Global state
  const [scale, setScale] = useState(1);
  const [useRetroStyle, setUseRetroStyle] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

  // Refs
  const stageRef = useRef(null);
  const worldRef = useRef(null);
  const inputRef = useRef(null);

  // History management for undo/redo
  const {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory(50); // Keep up to 50 history entries

  // Smart debug logging function that combines similar actions
  const logDebug = useCallback((action, details = null) => {
    const timestamp = new Date().toLocaleTimeString();

    // Check if we have a recent similar action to combine
    const recentLogIndex = debugLogs.findIndex(log =>
      log.action === action &&
      (Date.now() - new Date(log.timestamp).getTime()) < 2000 // 2 second window
    );

    if (recentLogIndex !== -1) {
      // Combine with existing log
      const existingLog = debugLogs[recentLogIndex];
      let combinedDetails = existingLog.details;

      if (action === 'ZOOM') {
        // For zoom, show start and end levels
        const startLevel = existingLog.details?.match(/from ([\d.]+) to ([\d.]+)/)?.[1];
        const endLevel = details?.match(/from ([\d.]+) to ([\d.]+)/)?.[2];
        if (startLevel && endLevel) {
          combinedDetails = `Zoom changed from ${startLevel} to ${endLevel} (combined multiple zoom actions)`;
        }
      } else if (action === 'MOVE_PANEL') {
        // For panel movement, show start and end positions
        const startPos = existingLog.details?.match(/from \(([^)]+)\) to \(([^)]+)\)/)?.[1];
        const endPos = details?.match(/from \(([^)]+)\) to \(([^)]+)\)/)?.[2];
        if (startPos && endPos) {
          combinedDetails = `Panel moved from (${startPos}) to (${endPos}) (combined multiple movements)`;
        }
      } else {
        // For other actions, just indicate they were combined
        combinedDetails = `${existingLog.details} (combined with subsequent similar actions)`;
      }

      // Update the existing log
      setDebugLogs(prev => {
        const updated = [...prev];
        updated[recentLogIndex] = {
          ...existingLog,
          details: combinedDetails,
          timestamp: timestamp // Update timestamp to show when it was last updated
        };
        return updated;
      });
    } else {
      // Create new log entry
      const logEntry = {
        action,
        timestamp,
        details
      };
      setDebugLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
    }
  }, [debugLogs]);

  // Custom hooks
  const {
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
    createNewCanvas,
    openCanvas,
    deleteCanvas
  } = useCanvas(addToHistory);

  const {
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
  } = usePanelManagement(panels, setPanels, addToHistory);

  const {
    plusState,
    plusButtonInteractionRef
  } = usePanelEdgeDetection(panels, scale, isDraggingAny, worldRef, findNeighborOnSide);

  // Wheel event handler for zooming
  const handleWheel = useCallback((e) => {
    const overInput = e.target.closest('input, [contenteditable="true"]');
    if (overInput) return;
    e.preventDefault();

    // Use a more gradual zoom step for smoother experience
    const zoomSensitivity = 0.001; // Reduced sensitivity
    const delta = e.deltaY * zoomSensitivity;
    const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +(scale - delta).toFixed(3)));

    // Only update if there's a meaningful change
    if (Math.abs(newScale - scale) > 0.01) {
      // Log debug info for significant zoom changes
      if (Math.abs(newScale - scale) > 0.05) {
        logDebug('ZOOM', `Zoom changed from ${scale.toFixed(2)} to ${newScale.toFixed(2)}`);
      }

      setScale(newScale);
    }
  }, [scale, logDebug]);

  // Function removed - no longer forcing button to appear

  // Attach non-passive wheel listener for zooming
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Keyboard shortcut handler for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if target is an input or contenteditable
      const isInputField = e.target.tagName === 'INPUT' ||
        e.target.getAttribute('contenteditable') === 'true';

      // Ctrl/Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !isInputField) {
        e.preventDefault();
        undo();
        logDebug('KEYBOARD_UNDO', 'Ctrl+Z pressed');
      }

      // Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y for redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        if (!isInputField) {
          e.preventDefault();
          redo();
          logDebug('KEYBOARD_REDO', 'Ctrl+Shift+Z or Ctrl+Y pressed');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div
      ref={stageRef}
      className="min-h-screen paper-background overflow-hidden relative"
    >
      {/* Combined Canvases button with + button */}
      <div className="style-toggle-container" style={{ left: '20px', right: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          className="style-toggle-button"
          onClick={() => setShowCanvasLibrary(!showCanvasLibrary)}
          title="Show Canvas Library"
        >
          <span className="toggle-icon">📚</span>
          <span className="toggle-text">Canvases</span>
        </button>

        <button
          className="style-toggle-button new-canvas-btn"
          onClick={(e) => {
            // Create a custom version that doesn't close the dropdown
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling

            // Record history BEFORE creating the canvas
            const prevCanvases = [...canvases];
            const prevActiveCanvasId = activeCanvasId;
            const prevPanels = [...panels];

            const x = Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2);
            const y = Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2);
            const newPanelId = `panel-${Date.now()}`;
            const newPanel = { id: newPanelId, x, y, title: 'PayTracker', state: undefined };
            const canvasId = `canvas-${Date.now() + Math.random()}`;
            const newCanvas = {
              id: canvasId,
              name: `Canvas ${canvases.length + 1}`,
              panels: [newPanel],
              lastSnapshotAt: Date.now()
            };

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

            // Update state
            setCanvases(prev => [...prev, newCanvas]);
            setActiveCanvasId(canvasId);
            setPanels([newPanel]);

            // Log debug info
            logDebug('CREATE_CANVAS', `New canvas ${canvasId} created with panel ${newPanelId}`);
          }}
          title="Create new canvas"
          style={{ padding: '6px', minWidth: 'auto' }}
        >
          <span className="toggle-icon" style={{ margin: 0 }}>➕</span>
        </button>
      </div>

      {/* Style toggle button */}
      <div className="style-toggle-container mb-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={() => {
            const newStyle = !useRetroStyle;
            setUseRetroStyle(newStyle);
            logDebug('STYLE_TOGGLE', `Style changed to ${newStyle ? 'Retro Digital' : 'Basic Font'}`);
          }}
          className="style-toggle-button"
          title={useRetroStyle ? "Switch to Basic Font" : "Switch to Retro Digital"}
        >
          <span className="toggle-icon">{useRetroStyle ? "🔢" : "📱"}</span>
          <span className="toggle-text">{useRetroStyle ? "Retro Digital" : "Basic Font"}</span>
        </button>

        <button
          onClick={() => {
            setShowDebug(!showDebug);
            logDebug('DEBUG_TOGGLE', showDebug ? 'Debug window closed' : 'Debug window opened');
          }}
          className="style-toggle-button"
          title="Toggle Debug Window"
        >
          <span className="toggle-icon">🐛</span>
          <span className="toggle-text">Debug</span>
        </button>
      </div>

      {/* Undo/Redo buttons */}
      <div className="history-controls">
        <button
          onClick={() => {
            undo();
            logDebug('UNDO', 'Undo action performed');
          }}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`history-button ${!canUndo ? 'disabled' : ''}`}
        >
          ↩
        </button>
        <button
          onClick={() => {
            redo();
            logDebug('REDO', 'Redo action performed');
          }}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`history-button ${!canRedo ? 'disabled' : ''}`}
        >
          ↪
        </button>
      </div>

      {/* Main world container */}
      <div
        className="world"
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '50% 50%',
          transform: `scale(${scale})`
        }}
        ref={worldRef}
      >
        {/* Render all panels */}
        {panels.map((p) => (
          <PanelWrapper
            key={p.id}
            panel={p}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={(panelId) => {
              // Get the final position for debug logging
              const finalPanel = panels.find(p => p.id === panelId);
              if (finalPanel) {
                // The handleDragEnd in usePanelManagement will handle the detailed logging
                handleDragEnd(panelId);
              }
            }}
            useRetroStyleGlobal={useRetroStyle}
            onStateChange={handlePanelStateChange}
            onDelete={(panelId) => {
              // Record history before deleting panel
              const panelToDelete = panels.find(p => p.id === panelId);
              const prevPanels = [...panels];

              addToHistory(
                'DELETE_PANEL',
                { panels: prevPanels },
                { panels: prevPanels.filter(p => p.id !== panelId) },
                (state) => setPanels(state.panels)
              );

              // Delete the panel
              setPanels(prev => prev.filter(p => p.id !== panelId));

              // Log debug info
              logDebug('DELETE_PANEL', `Panel ${panelId} deleted`);
            }}
            scale={scale}
          />
        ))}

        {/* Preview panel when hovering over plus button */}
        {previewPanel && (
          <div
            className="preview-panel"
            style={{
              position: 'absolute',
              left: `${previewPanel.x}px`,
              top: `${previewPanel.y}px`,
              width: `${PANEL_WIDTH}px`,
              height: `${PANEL_HEIGHT}px`,
              background: 'rgba(240, 240, 240, 0.15)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              borderRadius: '20px',
              boxShadow: '20px 20px 60px rgba(0, 0, 0, 0.08), -20px -20px 60px rgba(255, 255, 255, 0.1)',
              border: '2px dashed rgba(100, 100, 100, 0.3)',
              zIndex: 19
            }}
          />
        )}

        {/* PLUS BUTTON - Only show when cursor is near edges using plusState */}
        {plusState && (
          <button
            className="global-plus visible"
            style={{
              left: `${plusState.x}px`,
              top: `${plusState.y}px`
            }}
            onClick={(e) => {
              console.log(`DEBUG: Plus button clicked! plusState:`, plusState);
              console.log(`DEBUG: Current panels:`, panels);

              e.stopPropagation();
              e.preventDefault();

              plusButtonInteractionRef.current.isClicking = true;
              plusButtonInteractionRef.current.protectedUntil = Date.now() + 1500;

              // Handle the click - use plusState if available, otherwise use first panel
              const panelId = plusState ? plusState.panelId : panels[0]?.id;
              const side = plusState ? plusState.side : 'right';
              const neighborId = plusState ? plusState.neighborId : null;

              // Only proceed if we have a valid panel ID
              if (panelId) {
                // Log debug info before calling handleAddPanel
                console.log(`DEBUG: Plus button clicked for panel ${panelId}, side: ${side}`);

                // Use setTimeout to break potential update cycles
                setTimeout(() => {
                  console.log(`DEBUG: Calling handleAddPanel with panelId: ${panelId}, side: ${side}`);
                  const prevPanelCount = panels.length;
                  handleAddPanel(panelId, side, neighborId);
                  handlePlusMouseLeave();

                  // Log debug info with actual result
                  setTimeout(() => {
                    const newPanelCount = panels.length;
                    if (newPanelCount > prevPanelCount) {
                      logDebug('ADD_PANEL', `New panel successfully added to ${side} of panel ${panelId}`);
                    } else {
                      logDebug('ADD_PANEL', `Failed to add panel - no new panel created`);
                    }
                  }, 100);
                }, 0);
              } else {
                console.log(`DEBUG: No valid panelId found. panels.length: ${panels.length}`);
                logDebug('ADD_PANEL', `Failed to add panel - no valid panel ID found`);
              }

              setTimeout(() => {
                plusButtonInteractionRef.current.isClicking = false;
              }, 200);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              plusButtonInteractionRef.current.isClicking = true;
            }}
            onMouseUp={() => {
              setTimeout(() => {
                plusButtonInteractionRef.current.isClicking = false;
              }, 100);
            }}
            onMouseEnter={() => {
              if (plusState) {
                handlePlusMouseEnter(plusState.panelId, plusState.side);
              } else if (panels.length > 0) {
                handlePlusMouseEnter(panels[0].id, 'right');
              }
            }}
            onMouseLeave={handlePlusMouseLeave}
            title="Add new panel"
          >
            +
          </button>
        )}
      </div>

      {/* Canvas library overlay */}
      {showCanvasLibrary && (
        <div className="canvas-library" style={{
          position: 'fixed',
          top: '120px',
          left: '20px',
          width: '260px',
          background: 'rgba(240,240,240,0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '10px',
          boxShadow: '8px 8px 16px rgba(0,0,0,0.15), -8px -8px 16px rgba(255,255,255,0.6)',
          zIndex: 50
        }}>
          <div style={{ fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Canvases</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '60vh', overflowY: 'auto' }}>
            {canvases.map(c => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  background: activeCanvasId === c.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer'
                }}
                onClick={() => openCanvas(c.id)}
              >
                {editingCanvasId === c.id ? (
                  <input
                    ref={inputRef}
                    value={editingCanvasName}
                    onChange={e => setEditingCanvasName(e.target.value)}
                    onBlur={() => {
                      if (editingCanvasName.trim()) {
                        setCanvases(prev => prev.map(cc =>
                          cc.id === c.id ? { ...cc, name: editingCanvasName.trim() } : cc
                        ));
                      }
                      setEditingCanvasId(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (editingCanvasName.trim()) {
                          setCanvases(prev => prev.map(cc =>
                            cc.id === c.id ? { ...cc, name: editingCanvasName.trim() } : cc
                          ));
                        }
                        setEditingCanvasId(null);
                      } else if (e.key === 'Escape') {
                        setEditingCanvasId(null);
                      }
                    }}
                    style={{
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 600,
                      width: '100%',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '2px 4px'
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span
                    style={{ color: '#374151', fontSize: '12px', fontWeight: 600 }}
                    onDoubleClick={e => {
                      e.stopPropagation();
                      setEditingCanvasId(c.id);
                      setEditingCanvasName(c.name);
                    }}
                  >
                    {c.name}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className="control-button"
                    style={{ padding: '4px 6px' }}
                    title="Delete"
                    onClick={e => {
                      e.stopPropagation();
                      deleteCanvas(c.id);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Window */}
      <DebugWindow
        isVisible={showDebug}
        onToggle={() => setShowDebug(false)}
        debugLogs={debugLogs}
      />
    </div>
  );
}
