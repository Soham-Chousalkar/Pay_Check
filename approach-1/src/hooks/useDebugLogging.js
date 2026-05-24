import { useState, useCallback } from 'react'

export const useDebugLogging = () => {
  const [debugLogs, setDebugLogs] = useState([])

  const logDebug = useCallback((action, details = null) => {
    const timestamp = new Date().toLocaleTimeString()
    const recentLogIndex = debugLogs.findIndex(log =>
      log.action === action &&
      (Date.now() - new Date(log.timestamp).getTime()) < 2000
    )

    if (recentLogIndex !== -1) {
      const existingLog = debugLogs[recentLogIndex]
      let combinedDetails = existingLog.details

      if (action === 'ZOOM') {
        const startLevel = existingLog.details?.match(/from ([\d.]+) to ([\d.]+)/)?.[1]
        const endLevel = details?.match(/from ([\d.]+) to ([\d.]+)/)?.[2]
        if (startLevel && endLevel) {
          combinedDetails = `Zoom changed from ${startLevel} to ${endLevel} (combined multiple zoom actions)`
        }
      } else if (action === 'MOVE_PANEL') {
        const startPos = existingLog.details?.match(/from \(([^)]+)\) to \(([^)]+)\)/)?.[1]
        const endPos = details?.match(/from \(([^)]+)\) to \(([^)]+)\)/)?.[2]
        if (startPos && endPos) {
          combinedDetails = `Panel moved from (${startPos}) to (${endPos}) (combined multiple movements)`
        }
      } else {
        combinedDetails = `${existingLog.details} (combined with subsequent similar actions)`
      }

      setDebugLogs(prev => {
        const updated = [...prev]
        updated[recentLogIndex] = { ...existingLog, details: combinedDetails, timestamp }
        return updated
      })
    } else {
      const logEntry = { action, timestamp, details }
      setDebugLogs(prev => [...prev.slice(-49), logEntry])
    }
  }, [debugLogs])

  return {
    debugLogs,
    logDebug
  }
}
