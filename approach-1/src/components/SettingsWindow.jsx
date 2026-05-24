export default function SettingsWindow({
    showSettings,
    panelOpacity,
    setPanelOpacity,
    backgroundImage,
    setBackgroundImage,
    user,
    logout,
    logDebug
}) {
    if (!showSettings) return null;

    return (
        <div className="settings-window" style={{
            position: 'fixed',
            left: '0',
            top: '0',
            width: '200px',
            height: '100vh',
            backgroundColor: 'rgba(240,240,240,0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '0 12px 12px 0',
            padding: '20px',
            boxShadow: '8px 0 16px rgba(0,0,0,0.15)',
            zIndex: 1000,
            transform: 'translateX(0)',
            transition: 'transform 0.3s ease-in-out'
        }}>
            {/* Settings Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '2px solid rgba(100,100,100,0.2)',
                paddingBottom: '10px'
            }}>
                <h2 style={{
                    margin: 0,
                    color: '#374151',
                    fontSize: '18px',
                    fontWeight: 'bold'
                }}>
                    ⚙️ Settings
                </h2>
            </div>

            {/* Panel Opacity Setting */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                }}>
                    Panel Opacity: {panelOpacity}%
                </label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={panelOpacity}
                    onChange={(e) => {
                        const newOpacity = parseInt(e.target.value);
                        setPanelOpacity(newOpacity);
                        logDebug('OPACITY_CHANGE', `Panel opacity changed to ${newOpacity}%`);
                    }}
                    style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        background: 'linear-gradient(to right, rgba(100,100,100,0.3), rgba(100,100,100,0.8))',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                />
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '4px'
                }}>
                    <span>0%</span>
                    <span>100%</span>
                </div>
            </div>

            {/* Background Image Setting */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                }}>
                    🖼️ Background Image
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                setBackgroundImage(event.target.result);
                                logDebug('BACKGROUND_CHANGE', `Background image uploaded: ${file.name}`);
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid rgba(100,100,100,0.3)',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        fontSize: '12px'
                    }}
                />
                {backgroundImage && (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                        <button
                            onClick={() => {
                                setBackgroundImage(null);
                                logDebug('BACKGROUND_CHANGE', 'Background image removed');
                            }}
                            style={{
                                background: 'rgba(255,0,0,0.1)',
                                border: '1px solid rgba(255,0,0,0.3)',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                color: '#d32f2f',
                                cursor: 'pointer',
                                fontSize: '11px'
                            }}
                        >
                            🗑️ Remove Background
                        </button>
                    </div>
                )}
            </div>

            {/* Logout Button */}
            {user && (
                <button
                    onClick={logout}
                    style={{
                        width: '100%',
                        padding: '8px 16px',
                        backgroundColor: 'rgba(220,38,38,0.1)',
                        border: '1px solid rgba(220,38,38,0.3)',
                        borderRadius: '6px',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                    }}
                >
                    🚪 Logout
                </button>
            )}
        </div>
    )
}

