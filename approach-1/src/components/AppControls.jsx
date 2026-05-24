import React from 'react'

const AppControls = ({ 
  showDebug, 
  setShowDebug, 
  useRetroStyle, 
  setUseRetroStyle, 
  logDebug 
}) => {
  return (
    <div className="style-toggle-container mb-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
    </div>
  )
}

export default AppControls