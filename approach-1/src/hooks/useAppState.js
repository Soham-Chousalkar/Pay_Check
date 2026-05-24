import { useState, useCallback } from 'react'

export const useAppState = () => {
  const [useRetroStyle, setUseRetroStyle] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [panelOpacity, setPanelOpacity] = useState(60)
  const [backgroundImage, setBackgroundImage] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const toggleRetroStyle = useCallback(() => {
    setUseRetroStyle(prev => !prev)
  }, [])

  const toggleDebug = useCallback(() => {
    setShowDebug(prev => !prev)
  }, [])

  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev)
  }, [])

  const toggleLoginModal = useCallback(() => {
    setShowLoginModal(prev => !prev)
  }, [])

  return {
    useRetroStyle,
    setUseRetroStyle,
    toggleRetroStyle,
    showDebug,
    setShowDebug,
    toggleDebug,
    showSettings,
    setShowSettings,
    toggleSettings,
    panelOpacity,
    setPanelOpacity,
    backgroundImage,
    setBackgroundImage,
    showLoginModal,
    setShowLoginModal,
    toggleLoginModal
  }
}
