import { renderHook, act } from '@testing-library/react'
import { useAppState } from '../useAppState'

describe('useAppState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAppState())
    
    expect(result.current.useRetroStyle).toBe(false)
    expect(result.current.showDebug).toBe(false)
    expect(result.current.showSettings).toBe(false)
    expect(result.current.panelOpacity).toBe(60)
    expect(result.current.backgroundImage).toBe(null)
    expect(result.current.showLoginModal).toBe(false)
  })

  it('should provide toggle functions', () => {
    const { result } = renderHook(() => useAppState())
    
    expect(typeof result.current.toggleRetroStyle).toBe('function')
    expect(typeof result.current.toggleDebug).toBe('function')
    expect(typeof result.current.toggleSettings).toBe('function')
    expect(typeof result.current.toggleLoginModal).toBe('function')
  })

  it('should toggle retro style', () => {
    const { result } = renderHook(() => useAppState())
    
    act(() => {
      result.current.toggleRetroStyle()
    })
    
    expect(result.current.useRetroStyle).toBe(true)
    
    act(() => {
      result.current.toggleRetroStyle()
    })
    
    expect(result.current.useRetroStyle).toBe(false)
  })

  it('should toggle debug', () => {
    const { result } = renderHook(() => useAppState())
    
    act(() => {
      result.current.toggleDebug()
    })
    
    expect(result.current.showDebug).toBe(true)
    
    act(() => {
      result.current.toggleDebug()
    })
    
    expect(result.current.showDebug).toBe(false)
  })

  it('should toggle settings', () => {
    const { result } = renderHook(() => useAppState())
    
    act(() => {
      result.current.toggleSettings()
    })
    
    expect(result.current.showSettings).toBe(true)
    
    act(() => {
      result.current.toggleSettings()
    })
    
    expect(result.current.showSettings).toBe(false)
  })

  it('should toggle login modal', () => {
    const { result } = renderHook(() => useAppState())
    
    act(() => {
      result.current.toggleLoginModal()
    })
    
    expect(result.current.showLoginModal).toBe(true)
    
    act(() => {
      result.current.toggleLoginModal()
    })
    
    expect(result.current.showLoginModal).toBe(false)
  })

  it('should update panel opacity', () => {
    const { result } = renderHook(() => useAppState())
    
    act(() => {
      result.current.setPanelOpacity(80)
    })
    
    expect(result.current.panelOpacity).toBe(80)
  })

  it('should update background image', () => {
    const { result } = renderHook(() => useAppState())
    
    act(() => {
      result.current.setBackgroundImage('test-image.jpg')
    })
    
    expect(result.current.backgroundImage).toBe('test-image.jpg')
  })
})
