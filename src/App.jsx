import { useEffect, useRef, useState, useCallback } from "react";
import PanelWrapper from "./components/PanelWrapper";
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

  // Custom hooks
  const {
    canvases,
    setCanvases,
    activeCanvasId,
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
  } = useCanvas();

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
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setScale((prev) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +(prev + delta).toFixed(2))));
  }, []);

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
      }

      // Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y for redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        if (!isInputField) {
          e.preventDefault();
          redo();
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

            // Update state in sequence to avoid race conditions
            setCanvases(prev => {
              const updated = [...prev, newCanvas];
              setTimeout(() => {
                setActiveCanvasId(canvasId);
                setTimeout(() => {
                  setPanels([newPanel]);
                }, 0);
              }, 0);
              return updated;
            });
          }}
          title="Create new canvas"
          style={{ padding: '6px', minWidth: 'auto' }}
        >
          <span className="toggle-icon" style={{ margin: 0 }}>➕</span>
        </button>
      </div>

      {/* Style toggle button */}
      <div className="style-toggle-container mb-4">
        <button
          onClick={() => setUseRetroStyle(!useRetroStyle)}
          className="style-toggle-button"
          title={useRetroStyle ? "Switch to Basic Font" : "Switch to Retro Digital"}
        >
          <span className="toggle-icon">{useRetroStyle ? "🔢" : "📱"}</span>
          <span className="toggle-text">{useRetroStyle ? "Retro Digital" : "Basic Font"}</span>
        </button>
      </div>

      {/* Undo/Redo buttons */}
      <div className="history-controls">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`history-button ${!canUndo ? 'disabled' : ''}`}
        >
          ↩
        </button>
        <button
          onClick={redo}
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
            onDragEnd={handleDragEnd}
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
                // Use setTimeout to break potential update cycles
                setTimeout(() => {
                  handleAddPanel(panelId, side, neighborId);
                  handlePlusMouseLeave();
                }, 0);
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
    </div>
  );
}
