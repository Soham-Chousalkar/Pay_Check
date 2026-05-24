export default function CanvasLibrary({
    showCanvasLibrary,
    showSettings,
    canvases,
    activeCanvasId,
    openCanvas,
    editingCanvasId,
    setEditingCanvasId,
    editingCanvasName,
    setEditingCanvasName,
    inputRef,
    setCanvases,
    deleteCanvas
}) {
    if (!showCanvasLibrary) return null;

    return (
        <div className="canvas-library" style={{
            position: 'fixed',
            top: '120px',
            left: showSettings ? '250px' : '20px',
            width: '260px',
            background: 'rgba(240,240,240,0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '10px',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.15), -8px -8px 16px rgba(255,255,255,0.6)',
            zIndex: 50,
            transition: 'left 0.3s ease-in-out'
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
    )
}

