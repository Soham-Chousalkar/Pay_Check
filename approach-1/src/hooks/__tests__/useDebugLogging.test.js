import { renderHook, act } from '@testing-library/react'
import { useDebugLogging } from '../useDebugLogging'

describe('useDebugLogging', () => {
  it('should initialize with empty debug logs', () => {
    const { result } = renderHook(() => useDebugLogging())
    
    expect(result.current.debugLogs).toEqual([])
    expect(typeof result.current.logDebug).toBe('function')
  })

  it('should add new log entries', () => {
    const { result } = renderHook(() => useDebugLogging())
    
    act(() => {
      result.current.logDebug('TEST_ACTION', 'Test details')
    })
    
    expect(result.current.debugLogs).toHaveLength(1)
    expect(result.current.debugLogs[0]).toMatchObject({
      action: 'TEST_ACTION',
      details: 'Test details'
    })
  })

  it('should combine similar actions within 2 seconds', () => {
    const { result } = renderHook(() => useDebugLogging())
    
    // Mock Date to control timing
    const originalDate = Date
    let mockTime = 1000000000000
    const mockDate = jest.fn(() => ({
      toLocaleTimeString: () => '9:00:00 AM',
      getTime: () => mockTime
    }))
    mockDate.now = jest.fn(() => mockTime)
    global.Date = mockDate
    
    act(() => {
      result.current.logDebug('ZOOM', 'Zoom changed from 1.00 to 1.50')
    })
    
    // Advance time by 1 second (within 2-second window)
    mockTime += 1000
    mockDate.now = jest.fn(() => mockTime)
    
    act(() => {
      result.current.logDebug('ZOOM', 'Zoom changed from 1.50 to 2.00')
    })
    
    expect(result.current.debugLogs).toHaveLength(1)
    expect(result.current.debugLogs[0].details).toContain('Zoom changed from 1.00 to 2.00')
    
    // Restore original Date
    global.Date = originalDate
  })

  it('should limit logs to 50 entries', () => {
    const { result } = renderHook(() => useDebugLogging())
    
    // Add 51 log entries
    act(() => {
      for (let i = 0; i < 51; i++) {
        result.current.logDebug('TEST_ACTION', `Test ${i}`)
      }
    })
    
    expect(result.current.debugLogs).toHaveLength(50)
    expect(result.current.debugLogs[0].details).toBe('Test 1') // First entry should be removed
    expect(result.current.debugLogs[49].details).toBe('Test 50') // Last entry should be kept
  })

  it('should handle null details', () => {
    const { result } = renderHook(() => useDebugLogging())
    
    act(() => {
      result.current.logDebug('TEST_ACTION')
    })
    
    expect(result.current.debugLogs).toHaveLength(1)
    expect(result.current.debugLogs[0].details).toBe(null)
  })
})
