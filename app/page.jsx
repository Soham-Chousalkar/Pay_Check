'use client'

import { useState, useRef, useCallback } from 'react'

import PanelWrapper from './components/PanelWrapper'
import DebugWindow from './components/DebugWindow'
import { PANEL_WIDTH, PANEL_HEIGHT } from './utils/panelUtils'

export default function Home() {
    const [isDebugOpen, setIsDebugOpen] = useState(false)
    const [debugLogs, setDebugLogs] = useState([])
    const [scale, setScale] = useState(1)
    const [showCanvasLibrary, setShowCanvasLibrary] = useState(false)
    const [canvases, setCanvases] = useState([
        {
            id: 'canvas-1',
            name: 'Main Canvas',
            panels: [
                { id: 'panel-1', x: 100, y: 100, title: 'PayTracker', state: undefined }
            ],
            lastSnapshotAt: Date.now()
        }
    ])
    const [activeCanvasId, setActiveCanvasId] = useState('canvas-1')
    const [panels, setPanels] = useState([
        { id: 'panel-1', x: 100, y: 100, title: 'PayTracker', state: undefined }
    ])
    const [panelOpacity, setPanelOpacity] = useState(60)

    const activeCanvas = canvases.find(c => c.id === activeCanvasId)
    const activePanels = activeCanvas ? activeCanvas.panels : []

    const logDebug = useCallback((action, details = null) => {
        const timestamp = new Date().toLocaleTimeString()
        const logEntry = { action, timestamp, details }
        setDebugLogs(prev => [...prev.slice(-49), logEntry])
    }, [])

    const handleAddPanel = useCallback(() => {
        const x = 150 // Near the Add Panel button
        const y = 100
        const newPanelId = `panel-${Date.now()}`
        const newPanel = { id: newPanelId, x, y, title: 'PayTracker', state: undefined }

        setPanels(prev => [...prev, newPanel])
        logDebug('CREATE_PANEL', `New panel ${newPanelId} created`)
    }, [])

    const handlePanelStateChange = useCallback((panelId, state) => {
        setPanels(prev => prev.map(p =>
            p.id === panelId ? { ...p, state } : p
        ))
        logDebug('PANEL_STATE_CHANGE', `Panel ${panelId} state updated`)
    }, [])

    const handlePanelDelete = useCallback((panelId) => {
        setPanels(prev => prev.filter(p => p.id !== panelId))
        logDebug('DELETE_PANEL', `Panel ${panelId} deleted`)
    }, [logDebug])

    const handleDrag = useCallback((panelId, position) => {
        setPanels(prev => prev.map(p =>
            p.id === panelId ? { ...p, x: position.x, y: position.y } : p
        ))
    }, [])

    const handleDragStart = useCallback((panelId, position) => {
        logDebug('DRAG_START', `Panel ${panelId} drag started`)
    }, [logDebug])

    const handleDragEnd = useCallback((panelId) => {
        logDebug('DRAG_END', `Panel ${panelId} drag ended`)
    }, [logDebug])

    return (
        <main className="min-h-screen bg-[#BBDCE5] text-[#CFAB8D] relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[#BBDCE5]"></div>

            {/* Header Controls */}
            <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
                <button
                    onClick={() => setShowCanvasLibrary(!showCanvasLibrary)}
                    className="bg-[#ECEEDF] hover:bg-[#D9C4B0] text-[#CFAB8D] px-4 py-2 rounded-lg flex items-center gap-2 border border-[#D9C4B0]"
                >
                    <span>📚</span>
                    <span>Canvases</span>
                </button>

                <button
                    onClick={handleAddPanel}
                    className="bg-[#ECEEDF] hover:bg-[#D9C4B0] text-[#CFAB8D] px-4 py-2 rounded-lg flex items-center gap-2 border border-[#D9C4B0]"
                >
                    <span>➕</span>
                    <span>Add Panel</span>
                </button>


            </div>

            {/* Canvas Library */}
            {showCanvasLibrary && (
                <div className="fixed top-20 left-4 z-40 bg-[#ECEEDF] p-4 rounded-lg border border-[#D9C4B0] min-w-64 shadow-lg">
                    <h3 className="text-lg font-bold mb-3 text-[#CFAB8D]">Canvas Library</h3>
                    <div className="space-y-2">
                        {canvases.map(canvas => (
                            <div
                                key={canvas.id}
                                className={`p-2 rounded cursor-pointer ${activeCanvasId === canvas.id
                                    ? 'bg-[#D9C4B0] text-[#ECEEDF]'
                                    : 'bg-[#ECEEDF] hover:bg-[#D9C4B0] text-[#CFAB8D] border border-[#D9C4B0]'
                                    }`}
                                onClick={() => setActiveCanvasId(canvas.id)}
                            >
                                <div className="font-medium">{canvas.name}</div>
                                <div className="text-sm opacity-70">
                                    {canvas.panels.length} panel{canvas.panels.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="relative z-10 p-4">


                {/* Panels */}
                <div className="relative">
                    {activePanels.map(panel => (
                        <PanelWrapper
                            key={panel.id}
                            panel={panel}
                            onDragStart={handleDragStart}
                            onDrag={handleDrag}
                            onDragEnd={handleDragEnd}
                            onStateChange={handlePanelStateChange}
                            onDelete={handlePanelDelete}
                            scale={scale}
                            panelOpacity={panelOpacity}
                        />
                    ))}
                </div>
            </div>

            {/* Debug Window */}
            <DebugWindow
                isVisible={isDebugOpen}
                onToggle={() => setIsDebugOpen(false)}
                debugLogs={debugLogs}
            />

            {/* Debug Button */}
            <button
                onClick={() => setIsDebugOpen(true)}
                className="fixed bottom-4 right-4 bg-[#ECEEDF] hover:bg-[#D9C4B0] text-[#CFAB8D] px-4 py-2 rounded-lg z-50 border border-[#D9C4B0]"
            >
                Debug
            </button>


        </main>
    )
}

