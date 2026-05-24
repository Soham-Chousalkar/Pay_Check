import { useEffect } from 'react'

export const useKeyboardShortcuts = ({ undo, redo, logDebug }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if target is an input or contenteditable
      const isInputField = e.target.tagName === 'INPUT' ||
        e.target.getAttribute('contenteditable') === 'true'

      // Ctrl/Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !isInputField) {
        e.preventDefault()
        undo()
        logDebug('KEYBOARD_UNDO', 'Ctrl+Z pressed')
      }

      // Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y for redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        if (!isInputField) {
          e.preventDefault()
          redo()
          logDebug('KEYBOARD_REDO', 'Ctrl+Shift+Z or Ctrl+Y pressed')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, logDebug])
}
