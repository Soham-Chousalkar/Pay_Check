import { useState, useCallback, useEffect, useRef } from 'react'

const ZOOM_MIN = 0.01
const ZOOM_MAX = 10

export const useZoom = (logDebug) => {
  const [scale, setScale] = useState(1)
  const stageRef = useRef(null)

  // Wheel event handler for zooming
  const handleWheel = useCallback((e) => {
    const overInput = e.target.closest('input, [contenteditable="true"]')
    if (overInput) return
    e.preventDefault()

    const zoomSensitivity = 0.001
    const delta = e.deltaY * zoomSensitivity
    const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +(scale - delta).toFixed(3)))

    if (Math.abs(newScale - scale) > 0.01) {
      if (Math.abs(newScale - scale) > 0.05) {
        logDebug('ZOOM', `Zoom changed from ${scale.toFixed(2)} to ${newScale.toFixed(2)}`)
      }
      setScale(newScale)
    }
  }, [scale, logDebug])

  // Attach wheel listener
  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    const wheelHandler = (e) => handleWheel(e)
    el.addEventListener('wheel', wheelHandler, { passive: false })

    return () => {
      el.removeEventListener('wheel', wheelHandler)
    }
  }, [handleWheel])

  return {
    scale,
    setScale,
    stageRef
  }
}
