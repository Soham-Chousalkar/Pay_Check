import { useEffect, useRef, useState, useCallback } from "react";
import PanelWrapper from "./components/PanelWrapper";
import { PANEL_WIDTH, PANEL_HEIGHT, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from "./utils/panelUtils";
import { useCanvas } from "./hooks/useCanvas";
import { usePanelManagement } from "./hooks/usePanelManagement";
import { usePanelEdgeDetection } from "./hooks/usePanelEdgeDetection";

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
    } = usePanelManagement(panels, setPanels);

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

    // Attach non-passive wheel listener for zooming
    useEffect(() => {
        const el = stageRef.current;
        if (!el) return;
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    return (
        <div
            ref={stageRef}
            className="min-h-screen paper-background overflow-hidden relative"
        >
            {/* Canvas management buttons */}
            <div className="style-toggle-container" style={{ left: '20px', right: 'auto' }}>
                <button
                    className="style-toggle-button"
                    onClick={createNewCanvas}
                    title="Create new canvas"
                >
                    <span className="toggle-icon">➕</span>
                    <span className="toggle-text">New Canvas</span>
                </button>
            </div>

            <div className="style-toggle-container" style={{ left: '20px', right: 'auto', top: '70px' }}>
                <button
                    className="style-toggle-button"
                    onClick={() => setShowCanvasLibrary(!showCanvasLibrary)}
                    title="Canvas Library"
                >
                    <span className="toggle-icon">📚</span>
                    <span className="toggle-text">Library</span>
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

                {/* Show plus button only if there's space for a panel in that direction */}
                {plusState && hasSpaceForPanel(plusState.panelId, plusState.side) && (
                    <button
                        className="global-plus"
                        style={{ left: `${plusState.x}px`, top: `${plusState.y}px` }}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();

                            plusButtonInteractionRef.current.isClicking = true;
                            plusButtonInteractionRef.current.protectedUntil = Date.now() + 1500;

                            handleAddPanel(plusState.panelId, plusState.side, plusState.neighborId);
                            handlePlusMouseLeave();

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
                        onMouseEnter={() => handlePlusMouseEnter(plusState.panelId, plusState.side)}
                        onMouseLeave={handlePlusMouseLeave}
                        title={`Add panel ${plusState.side}`}
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
