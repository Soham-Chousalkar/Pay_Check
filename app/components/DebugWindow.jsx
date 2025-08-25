import { useState, useRef, useEffect } from 'react';

/**
 * DebugWindow - Shows user actions and their effects in a chat-like format
 */
function DebugWindow({ isVisible, onToggle, debugLogs }) {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
    const windowRef = useRef(null);

    const handleMouseDown = (e) => {
        if (e.target.closest('button, input')) return;

        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startPosX: position.x,
            startPosY: position.y
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;

        setPosition({
            x: dragRef.current.startPosX + deltaX,
            y: dragRef.current.startPosY + deltaY
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    // Prevent zoom events when hovering over debug window
    useEffect(() => {
        const handleWheel = (e) => {
            e.stopPropagation();
        };

        if (windowRef.current) {
            windowRef.current.addEventListener('wheel', handleWheel, { passive: false });
            return () => {
                if (windowRef.current) {
                    windowRef.current.removeEventListener('wheel', handleWheel);
                }
            };
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div
            ref={windowRef}
            className="debug-window"
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: '400px',
                maxHeight: '500px',
                backgroundColor: 'rgba(40, 40, 40, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'white',
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'move',
                    userSelect: 'none'
                }}
                onMouseDown={handleMouseDown}
            >
                <span style={{ fontWeight: 'bold', color: 'white' }}>Debug Console</span>
                <button
                    onClick={onToggle}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '10px'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                    Hide
                </button>
            </div>

            {/* Logs Container */}
            <div
                style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '12px 16px'
                }}
            >
                {debugLogs.length === 0 ? (
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                        No debug logs yet. Perform actions to see them here.
                    </div>
                ) : (
                    [...debugLogs].reverse().map((log, index) => (
                        <div
                            key={index}
                            style={{
                                marginBottom: '8px',
                                padding: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '6px',
                                borderLeft: '3px solid rgba(255, 255, 255, 0.3)'
                            }}
                        >
                            {/* Action */}
                            <div style={{ marginBottom: '4px' }}>
                                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 'bold' }}>
                                    Action:
                                </span>
                                <span style={{ color: 'white', marginLeft: '8px' }}>
                                    {log.action}
                                </span>
                            </div>

                            {/* Reaction */}
                            {log.details && (
                                <div>
                                    <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 'bold' }}>
                                        Reaction:
                                    </span>
                                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', marginLeft: '8px' }}>
                                        {log.details}
                                    </span>
                                </div>
                            )}

                            {/* Timestamp */}
                            <div style={{
                                marginTop: '4px',
                                fontSize: '10px',
                                color: 'rgba(255, 255, 255, 0.5)'
                            }}>
                                {log.timestamp}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default DebugWindow;
