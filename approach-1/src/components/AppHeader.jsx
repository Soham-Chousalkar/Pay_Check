import React, { useState, useRef, useEffect } from 'react'

const AppHeader = ({
  user,
  showSettings,
  setShowSettings,
  showCanvasLibrary,
  setShowCanvasLibrary,
  showLoginModal,
  setShowLoginModal,
  logout,
  logDebug
}) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
  }

  const handleLogin = () => {
    setShowLoginModal(true)
    setShowDropdown(false)
  }

  return (
    <>
      {/* Top-right Account dropdown */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1100, display: 'flex', gap: '8px' }}>
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className="style-toggle-button"
            onClick={() => setShowDropdown(!showDropdown)}
            title={user ? `Account: ${user.name}` : 'Guest Account'}
          >
            <span className="toggle-icon">{user ? '👤' : '👤'}</span>
            <span className="toggle-text">{user ? user.name : 'Guest'}</span>
            <span className="toggle-icon" style={{ marginLeft: '4px', fontSize: '12px' }}>
              {showDropdown ? '▲' : '▼'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                minWidth: '160px',
                overflow: 'hidden',
                zIndex: 1200
              }}
            >
              {user ? (
                <>
                  {/* User info */}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      {user.email}
                    </div>
                  </div>

                  {/* Logout option */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Guest info */}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Guest User
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      Limited functionality
                    </div>
                  </div>

                  {/* Login option */}
                  <button
                    onClick={handleLogin}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(5, 150, 105, 0.1)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <span>🔐</span>
                    <span>Login</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Settings button (hamburger menu) */}
      <div className="style-toggle-container" style={{
        left: '20px',
        top: '20px',
        right: 'auto',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1001,
        position: 'fixed'
      }}>
        <button
          className="style-toggle-button"
          onClick={() => {
            const newShowSettings = !showSettings;
            setShowSettings(newShowSettings);
            logDebug('SETTINGS_TOGGLE', newShowSettings ? 'Settings window opened' : 'Settings window closed');
          }}
          title="Toggle Settings"
        >
          <span className="toggle-icon">☰</span>
          <span className="toggle-text">Settings</span>
        </button>
      </div>
    </>
  )
}

export default AppHeader