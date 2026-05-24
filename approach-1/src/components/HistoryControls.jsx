export default function HistoryControls({ undo, redo, canUndo, canRedo, logDebug }) {
    return (
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
    )
}

