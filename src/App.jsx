import { useEffect, useRef, useState, useCallback } from "react";
import PanelWrapper from "./components/PanelWrapper";
import DebugWindow from "./components/DebugWindow";
import { useHistory } from "./hooks/useHistory";
import { useCanvas } from "./hooks/useCanvas";
import { usePanelManagement } from "./hooks/usePanelManagement";
import { usePanelEdgeDetection } from "./hooks/usePanelEdgeDetection";
import { PANEL_WIDTH, PANEL_HEIGHT, shouldGroupPanels } from "./utils/panelUtils";

// Zoom constants
const ZOOM_MIN = 0.01; // Allow zooming out to 1% (infinite zoom out)
const ZOOM_MAX = 10; // Allow zooming in to 1000% (single panel fits screen)

/**
 * Main App component - PayTracker
 */
export default function App() {
  // Global state
  const [scale, setScale] = useState(1);
  const [useRetroStyle, setUseRetroStyle] = useState(false); // Always basic font by default
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [panelOpacity, setPanelOpacity] = useState(60); // Default 60%
  const [groupingPreview, setGroupingPreview] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [groups, setGroups] = useState({});
  const [groupVisibility, setGroupVisibility] = useState({});

  // Refs
  const stageRef = useRef(null);
  const worldRef = useRef(null);
  const inputRef = useRef(null);

  // History management for undo/redo
  const {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory(50); // Keep up to 50 history entries

  // Smart debug logging function that combines similar actions
  const logDebug = useCallback((action, details = null) => {
    const timestamp = new Date().toLocaleTimeString();

    // Check if we have a recent similar action to combine
    const recentLogIndex = debugLogs.findIndex(log =>
      log.action === action &&
      (Date.now() - new Date(log.timestamp).getTime()) < 2000 // 2 second window
    );

    if (recentLogIndex !== -1) {
      // Combine with existing log
      const existingLog = debugLogs[recentLogIndex];
      let combinedDetails = existingLog.details;

      if (action === 'ZOOM') {
        // For zoom, show start and end levels
        const startLevel = existingLog.details?.match(/from ([\d.]+) to ([\d.]+)/)?.[1];
        const endLevel = details?.match(/from ([\d.]+) to ([\d.]+)/)?.[2];
        if (startLevel && endLevel) {
          combinedDetails = `Zoom changed from ${startLevel} to ${endLevel} (combined multiple zoom actions)`;
        }
      } else if (action === 'MOVE_PANEL') {
        // For panel movement, show start and end positions
        const startPos = existingLog.details?.match(/from \(([^)]+)\) to \(([^)]+)\)/)?.[1];
        const endPos = details?.match(/from \(([^)]+)\) to \(([^)]+)\)/)?.[2];
        if (startPos && endPos) {
          combinedDetails = `Panel moved from (${startPos}) to (${endPos}) (combined multiple movements)`;
        }
      } else {
        // For other actions, just indicate they were combined
        combinedDetails = `${existingLog.details} (combined with subsequent similar actions)`;
      }

      // Update the existing log
      setDebugLogs(prev => {
        const updated = [...prev];
        updated[recentLogIndex] = {
          ...existingLog,
          details: combinedDetails,
          timestamp: timestamp // Update timestamp to show when it was last updated
        };
        return updated;
      });
    } else {
      // Create new log entry
      const logEntry = {
        action,
        timestamp,
        details
      };
      setDebugLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
    }
  }, [debugLogs]);

  // Custom hooks
  const {
    canvases,
    setCanvases,
    activeCanvasId,
    setActiveCanvasId,
    panels,
    setPanels,
    showCanvasLibrary,
    setShowCanvasLibrary,
    editingCanvasId,
    setEditingCanvasId,
    editingCanvasName,
    setEditingCanvasName,
    createNewCanvas,
    openCanvas,
    deleteCanvas
  } = useCanvas(addToHistory);

  const {
    isDraggingAny,
    previewPanel,
    findNeighborOnSide,
    hasSpaceForPanel,
    handlePlusMouseEnter,
    handlePlusMouseLeave,
    handleDrag,
    handleDragStart,
    handleDragEnd,
    handleAddPanel
  } = usePanelManagement(panels, setPanels, addToHistory);

  const {
    plusState,
    plusButtonInteractionRef
  } = usePanelEdgeDetection(panels, scale, isDraggingAny, worldRef, findNeighborOnSide);

  // Function to calculate total earnings for grouped panels
  const calculateGroupEarnings = useCallback((panelIds) => {
    let totalEarnings = 0;
    panelIds.forEach(panelId => {
      const panel = panels.find(p => p.id === panelId);
      if (panel && panel.state && panel.state.earnings) {
        totalEarnings += panel.state.earnings;
      } else if (panel) {
        // If panel exists but no earnings yet, add 0 (this ensures the group shows $0.00 initially)
        totalEarnings += 0;
      }
    });
    return totalEarnings;
  }, [panels]);

  // Function to recalculate group container dimensions
  const recalculateGroupContainer = useCallback((groupId) => {
    const group = groups[groupId];
    if (!group) return;

    const groupPanels = panels.filter(p => group.panelIds.includes(p.id));
    if (groupPanels.length === 0) return;

    // Calculate new container dimensions based on current panel count
    const panelCount = groupPanels.length;
    const panelsPerRow = Math.ceil(Math.sqrt(panelCount));
    const rows = Math.ceil(panelCount / panelsPerRow);

    const containerPadding = 60;
    const panelSpacing = 30;
    const scaledPanelWidth = PANEL_WIDTH;
    const scaledPanelHeight = PANEL_HEIGHT;

    const containerWidth = (panelsPerRow * scaledPanelWidth) + ((panelsPerRow - 1) * panelSpacing) + containerPadding;
    const containerHeight = (rows * scaledPanelHeight) + ((rows - 1) * panelSpacing) + containerPadding + 100;

    // Calculate center position from current panel positions
    const minX = Math.min(...groupPanels.map(p => p.x));
    const maxX = Math.max(...groupPanels.map(p => p.x + scaledPanelWidth));
    const minY = Math.min(...groupPanels.map(p => p.y));
    const maxY = Math.max(...groupPanels.map(p => p.y + scaledPanelHeight));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const containerLeft = centerX - (containerWidth / 2);
    const containerTop = centerY - (containerHeight / 2);

    // Update group with new container dimensions
    setGroups(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        containerX: containerLeft,
        containerY: containerTop,
        containerWidth: containerWidth,
        containerHeight: containerHeight
      }
    }));
  }, [groups, panels]);

  // Function to update group earnings when panel states change
  const updateGroupEarnings = useCallback((panelId) => {
    // Find which group this panel belongs to
    const groupEntry = Object.entries(groups).find(([_, group]) =>
      group.panelIds.includes(panelId)
    );

    if (groupEntry) {
      const [groupId, group] = groupEntry;
      const newTotalEarnings = calculateGroupEarnings(group.panelIds);

      setGroups(prev => {
        const existingGroup = prev[groupId];
        if (!existingGroup) return prev; // Safety check

        return {
          ...prev,
          [groupId]: {
            ...existingGroup,
            totalEarnings: newTotalEarnings,
            title: `$${newTotalEarnings.toFixed(2)} - ${(existingGroup.title || 'Project Group').replace(/^\$[\d.]+ - /, '')}`
          }
        };
      });
    }
  }, [groups, calculateGroupEarnings]);

  // Panel state change handler
  const handlePanelStateChange = useCallback((panelId, state) => {
    // Update the panel state
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, state } : p));

    // Update group earnings if this panel belongs to a group
    updateGroupEarnings(panelId);

    logDebug('PANEL_STATE_CHANGE', `Panel ${panelId} state updated`);
  }, [updateGroupEarnings]);

  // Wheel event handler for zooming
  const handleWheel = useCallback((e) => {
    const overInput = e.target.closest('input, [contenteditable="true"]');
    if (overInput) return;
    e.preventDefault();

    // Use a more gradual zoom step for smoother experience
    const zoomSensitivity = 0.001; // Reduced sensitivity
    const delta = e.deltaY * zoomSensitivity;
    const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +(scale - delta).toFixed(3)));

    // Only update if there's a meaningful change
    if (Math.abs(newScale - scale) > 0.01) {
      // Log debug info for significant zoom changes
      if (Math.abs(newScale - scale) > 0.05) {
        logDebug('ZOOM', `Zoom changed from ${scale.toFixed(2)} to ${newScale.toFixed(2)}`);
      }

      setScale(newScale);
    }
  }, [scale, logDebug]);

  // Function removed - no longer forcing button to appear

  // Attach non-passive wheel listener for zooming
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Keyboard shortcut handler for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if target is an input or contenteditable
      const isInputField = e.target.tagName === 'INPUT' ||
        e.target.getAttribute('contenteditable') === 'true';

      // Ctrl/Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !isInputField) {
        e.preventDefault();
        undo();
        logDebug('KEYBOARD_UNDO', 'Ctrl+Z pressed');
      }

      // Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y for redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        if (!isInputField) {
          e.preventDefault();
          redo();
          logDebug('KEYBOARD_REDO', 'Ctrl+Shift+Z or Ctrl+Y pressed');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Function to detect overlapping panels for grouping
  const detectGroupingOpportunity = useCallback((draggedPanelId, draggedPanelPos) => {
    const draggedPanel = panels.find(p => p.id === draggedPanelId);
    if (!draggedPanel) return null;

    // Create a complete panel object with position and dimensions
    const draggedPanelWithDimensions = {
      x: draggedPanelPos.x,
      y: draggedPanelPos.y,
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT
    };

    // First, check if the dragged panel should be added to an existing group
    for (const [groupId, group] of Object.entries(groups)) {
      const groupPanels = panels.filter(p => group.panelIds.includes(p.id));
      
      // Check if dragged panel overlaps with any panel in this group
      for (const groupPanel of groupPanels) {
        const shouldGroup = shouldGroupPanels(draggedPanelWithDimensions, groupPanel);
        if (shouldGroup) {
          // Add panel to existing group
          const allPanelIds = [...group.panelIds, draggedPanelId];
          const totalEarnings = calculateGroupEarnings(allPanelIds);
          
          return {
            type: 'addToExisting',
            groupId: groupId,
            draggedPanelId,
            allPanelIds,
            totalEarnings,
            centerX: (draggedPanelPos.x + groupPanel.x) / 2,
            centerY: (draggedPanelPos.y + groupPanel.y) / 2
          };
        }
      }
    }

    // If not adding to existing group, check for creating new group with overlapping panels
    const overlappingPanels = panels.filter(panel => {
      if (panel.id === draggedPanelId) return false;
      
      // Don't include panels that already belong to groups
      const isInGroup = Object.values(groups).some(group => 
        group.panelIds.includes(panel.id)
      );
      if (isInGroup) return false;

      const shouldGroup = shouldGroupPanels(draggedPanelWithDimensions, panel);

      // Use 25% overlap threshold for better grouping
      return shouldGroup;
    });

    if (overlappingPanels.length > 0) {
      const allPanelIds = [draggedPanelId, ...overlappingPanels.map(p => p.id)];
      const totalEarnings = calculateGroupEarnings(allPanelIds);

      return {
        type: 'createNew',
        draggedPanelId,
        overlappingPanelIds: overlappingPanels.map(p => p.id),
        allPanelIds,
        totalEarnings,
        centerX: (draggedPanelPos.x + overlappingPanels[0].x) / 2,
        centerY: (draggedPanelPos.y + overlappingPanels[0].y) / 2
      };
    }

    return null;
  }, [panels, groups, calculateGroupEarnings]);

  // Function to rearrange panels within a group
  const rearrangeGroupPanels = useCallback((group) => {
    setPanels(prev => {
      const panelsToGroup = prev.filter(p => group.panelIds.includes(p.id));
      if (panelsToGroup.length === 0) return prev;

      // Calculate group center position from original panel positions
      const centerX = (Math.min(...panelsToGroup.map(p => p.x)) + Math.max(...panelsToGroup.map(p => p.x + PANEL_WIDTH))) / 2;
      const centerY = (Math.min(...panelsToGroup.map(p => p.y)) + Math.max(...panelsToGroup.map(p => p.y + PANEL_HEIGHT))) / 2;

      // Calculate grid layout - more organized grid
      const panelCount = panelsToGroup.length;
      const panelsPerRow = Math.ceil(Math.sqrt(panelCount));
      const rows = Math.ceil(panelCount / panelsPerRow);

      // Panel spacing and scaling - keep panels at full size for better usability
      const spacing = 30;
      const scaledPanelWidth = PANEL_WIDTH;
      const scaledPanelHeight = PANEL_HEIGHT;

      // Calculate total grid dimensions
      const gridWidth = (panelsPerRow * scaledPanelWidth) + ((panelsPerRow - 1) * spacing);
      const gridHeight = (rows * scaledPanelHeight) + ((rows - 1) * spacing);

      // Calculate starting position to center the grid
      const startX = centerX - (gridWidth / 2);
      const startY = centerY - (gridHeight / 2) + 40; // Offset for header

      return prev.map(panel => {
        if (group.panelIds.includes(panel.id)) {
          const panelIndex = group.panelIds.indexOf(panel.id);
          const row = Math.floor(panelIndex / panelsPerRow);
          const col = panelIndex % panelsPerRow;

          return {
            ...panel,
            x: startX + (col * (scaledPanelWidth + spacing)),
            y: startY + (row * (scaledPanelHeight + spacing))
          };
        }
        return panel;
      });
    });
  }, []);

  // Function to create a group when panels are dropped
  const createGroup = useCallback((groupingData) => {
    if (groupingData.type === 'addToExisting') {
      // Add panel to existing group
      const existingGroup = groups[groupingData.groupId];
      if (!existingGroup) return null;

      const updatedGroup = {
        ...existingGroup,
        panelIds: [...existingGroup.panelIds, groupingData.draggedPanelId],
        totalEarnings: groupingData.totalEarnings,
        title: `$${groupingData.totalEarnings.toFixed(2)} - ${(existingGroup.title || 'Project Group').replace(/^\$[\d.]+ - /, '')}`
      };

      setGroups(prev => ({ ...prev, [groupingData.groupId]: updatedGroup }));

      // Rearrange panels in the updated group
      rearrangeGroupPanels(updatedGroup);
      
      logDebug('PANEL_ADDED_TO_GROUP', `Panel ${groupingData.draggedPanelId} added to group ${groupingData.groupId}`);
      return groupingData.groupId;
    } else {
      // Create new group
      const groupId = `group-${Date.now()}`;
      const newGroup = {
        id: groupId,
        panelIds: groupingData.allPanelIds,
        totalEarnings: groupingData.totalEarnings,
        title: `$${groupingData.totalEarnings.toFixed(2)} - Project Group`,
        createdAt: Date.now()
      };

      setGroups(prev => ({ ...prev, [groupId]: newGroup }));
      setGroupVisibility(prev => ({ ...prev, [groupId]: true }));

      // Rearrange panels in the new group
      rearrangeGroupPanels(newGroup);

      logDebug('GROUP_CREATED', `Group ${groupId} created with ${groupingData.allPanelIds.length} panels, total: $${groupingData.totalEarnings.toFixed(2)}`);
      return groupId;
    }
  }, [groups, rearrangeGroupPanels, logDebug]);

  // Function to toggle group visibility
  const toggleGroupVisibility = useCallback((groupId) => {
    setGroupVisibility(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
    logDebug('GROUP_VISIBILITY_TOGGLED', `Group ${groupId} visibility: ${!groupVisibility[groupId] ? 'shown' : 'hidden'}`);
  }, [groupVisibility, logDebug]);

  // Function to update group title
  const updateGroupTitle = useCallback((groupId, newTitle) => {
    setGroups(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        title: newTitle
      }
    }));
    logDebug('GROUP_TITLE_UPDATED', `Group ${groupId} title changed to: ${newTitle}`);
  }, [logDebug]);

  return (
    <div
      ref={stageRef}
      className="min-h-screen paper-background overflow-hidden relative"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: backgroundImage ? 'cover' : undefined,
        backgroundPosition: backgroundImage ? 'center' : undefined,
        backgroundRepeat: backgroundImage ? 'no-repeat' : undefined
      }}
    >
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

      {/* Combined Canvases button with + button */}
      <div className="style-toggle-container" style={{
        left: showSettings ? '250px' : '20px',
        top: '80px',
        right: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'left 0.3s ease-in-out',
        zIndex: 1001,
        position: 'fixed'
      }}>
        <button
          className="style-toggle-button"
          onClick={() => setShowCanvasLibrary(!showCanvasLibrary)}
          title="Show Canvas Library"
        >
          <span className="toggle-icon">📚</span>
          <span className="toggle-text">Canvases</span>
        </button>

        <button
          className="style-toggle-button new-canvas-btn"
          onClick={(e) => {
            // Create a custom version that doesn't close the dropdown
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling

            // Record history BEFORE creating the canvas
            const prevCanvases = [...canvases];
            const prevActiveCanvasId = activeCanvasId;
            const prevPanels = [...panels];

            const x = Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2);
            const y = Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2);
            const newPanelId = `panel-${Date.now()}`;
            const newPanel = { id: newPanelId, x, y, title: 'PayTracker', state: undefined };
            const canvasId = `canvas-${Date.now() + Math.random()}`;
            const newCanvas = {
              id: canvasId,
              name: `Canvas ${canvases.length + 1}`,
              panels: [newPanel],
              lastSnapshotAt: Date.now()
            };

            // Record history for canvas creation
            if (addToHistory) {
              addToHistory(
                'CREATE_CANVAS',
                {
                  canvases: prevCanvases,
                  activeCanvasId: prevActiveCanvasId,
                  panels: prevPanels
                },
                {
                  canvases: [...prevCanvases, newCanvas],
                  activeCanvasId: canvasId,
                  panels: [newPanel]
                },
                (state) => {
                  // Restore the state properly
                  setCanvases(state.canvases);
                  if (state.activeCanvasId) {
                    setActiveCanvasId(state.activeCanvasId);
                  }
                  if (state.panels) {
                    setPanels(state.panels);
                  }
                }
              );
            }

            // Update state
            setCanvases(prev => [...prev, newCanvas]);
            setActiveCanvasId(canvasId);
            setPanels([newPanel]);

            // Log debug info
            logDebug('CREATE_CANVAS', `New canvas ${canvasId} created with panel ${newPanelId}`);
          }}
          title="Create new canvas"
          style={{ padding: '6px', minWidth: 'auto' }}
        >
          <span className="toggle-icon" style={{ margin: 0 }}>➕</span>
        </button>
      </div>

      {/* Style toggle button */}
      <div className="style-toggle-container mb-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

        <button
          onClick={() => {
            setShowDebug(!showDebug);
            logDebug('DEBUG_TOGGLE', showDebug ? 'Debug window closed' : 'Debug window opened');
          }}
          className="style-toggle-button"
          title="Toggle Debug Window"
        >
          <span className="toggle-icon">��</span>
          <span className="toggle-text">Debug</span>
        </button>
      </div>

      {/* Undo/Redo buttons */}
      <div className="history-controls">
        <button
          onClick={() => {
            undo();
            logDebug('UNDO', 'Undo action performed');
          }}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`history-button ${!canUndo ? 'disabled' : ''}`}
        >
          ↩
        </button>
        <button
          onClick={() => {
            redo();
            logDebug('REDO', 'Redo action performed');
          }}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`history-button ${!canRedo ? 'disabled' : ''}`}
        >
          ↪
        </button>
      </div>

      {/* Main world container */}
      <div
        className="world"
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '50% 50%',
          transform: `scale(${scale})`
        }}
        ref={worldRef}
      >
        {/* Render all panels */}
        {panels.map((p) => {
          // Check if panel belongs to a hidden group
          const panelGroup = Object.values(groups).find(group =>
            group.panelIds.includes(p.id)
          );
          const isInHiddenGroup = panelGroup && !groupVisibility[panelGroup.id];

          // Don't render panels that belong to hidden groups
          if (isInHiddenGroup) return null;

          return (
            <PanelWrapper
              key={p.id}
              panel={p}
              onDragStart={handleDragStart}
              isInGroup={Object.values(groups).some(group => group.panelIds.includes(p.id))}
              onDrag={(panelId, pos) => {
                // Check for grouping opportunities
                const grouping = detectGroupingOpportunity(panelId, pos);
                if (grouping) {
                  setGroupingPreview(grouping);
                } else {
                  setGroupingPreview(null);
                }

                // Check if panel is being dragged out of a group
                const currentGroup = Object.values(groups).find(group =>
                  group.panelIds.includes(panelId)
                );

                if (currentGroup) {
                  // Use the group container bounds for better containment
                  if (currentGroup.containerX !== undefined && currentGroup.containerY !== undefined) {
                    const containerLeft = currentGroup.containerX;
                    const containerTop = currentGroup.containerY;
                    const containerRight = containerLeft + currentGroup.containerWidth;
                    const containerBottom = containerTop + currentGroup.containerHeight;

                    // Keep panel within group container bounds with some padding
                    const padding = 20;
                    const constrainedX = Math.max(containerLeft + padding, Math.min(containerRight - PANEL_WIDTH - padding, pos.x));
                    const constrainedY = Math.max(containerTop + padding + 60, Math.min(containerBottom - PANEL_HEIGHT - padding, pos.y));

                    // Update position to constrained values
                    pos.x = constrainedX;
                    pos.y = constrainedY;
                  } else {
                    // Fallback to center-based distance checking
                    const groupPanels = panels.filter(p => currentGroup.panelIds.includes(p.id));
                    const minX = Math.min(...groupPanels.map(p => p.x));
                    const maxX = Math.max(...groupPanels.map(p => p.x + PANEL_WIDTH));
                    const minY = Math.min(...groupPanels.map(p => p.y));
                    const maxY = Math.max(...groupPanels.map(p => p.y + PANEL_HEIGHT));

                    const groupCenterX = (minX + maxX) / 2;
                    const groupCenterY = (minY + maxY) / 2;
                    const distanceFromCenter = Math.sqrt(
                      Math.pow(pos.x - groupCenterX, 2) + Math.pow(pos.y - groupCenterY, 2)
                    );

                    // If panel is dragged more than 150px from group center, remove it from group
                    if (distanceFromCenter > 150) {
                      setGroups(prev => {
                        const existingGroup = prev[currentGroup.id];
                        if (!existingGroup) return prev; // Safety check

                        const updatedGroup = {
                          ...existingGroup,
                          panelIds: existingGroup.panelIds.filter(id => id !== panelId)
                        };

                        return {
                          ...prev,
                          [currentGroup.id]: updatedGroup
                        };
                      });

                      // If group now has only 1 panel, remove the group entirely
                      if (currentGroup.panelIds.length <= 2) {
                        setGroups(prev => {
                          const newGroups = { ...prev };
                          delete newGroups[currentGroup.id];
                          return newGroups;
                        });
                        setGroupVisibility(prev => {
                          const newVisibility = { ...prev };
                          delete newVisibility[currentGroup.id];
                          return newVisibility;
                        });
                        logDebug('GROUP_REMOVED', `Group ${currentGroup.id} removed - insufficient panels`);
                      } else {
                        // Recalculate container dimensions for the updated group
                        setTimeout(() => recalculateGroupContainer(currentGroup.id), 50);
                        logDebug('PANEL_REMOVED_FROM_GROUP', `Panel ${panelId} removed from group ${currentGroup.id}`);
                      }
                    }
                  }
                }

                // Call the original drag handler
                handleDrag(panelId, pos);
              }}
              onDragEnd={(panelId) => {
                // Get the final position for debug logging
                const finalPanel = panels.find(p => p.id === panelId);
                if (finalPanel) {
                  handleDragEnd(panelId);
                }

                // Check if we should create a group
                if (groupingPreview && groupingPreview.draggedPanelId === panelId) {
                  createGroup(groupingPreview);
                  setGroupingPreview(null);
                }
              }}
              useRetroStyleGlobal={useRetroStyle}
              onStateChange={handlePanelStateChange}
              onDelete={(panelId) => {
                // Record history before deleting panel
                const panelToDelete = panels.find(p => p.id === panelId);
                const prevPanels = [...panels];

                addToHistory(
                  'DELETE_PANEL',
                  { panels: prevPanels },
                  { panels: prevPanels.filter(p => p.id !== panelId) },
                  (state) => setPanels(state.panels)
                );

                // Delete the panel
                setPanels(prev => prev.filter(p => p.id !== panelId));

                // Log debug info
                logDebug('DELETE_PANEL', `Panel ${panelId} deleted`);
              }}
              scale={scale}
              panelOpacity={panelOpacity}
            />
          );
        })}

        {/* Preview panel when hovering over plus button */}
        {previewPanel && (
          <div
            className="preview-panel"
            style={{
              position: 'absolute',
              left: `${previewPanel.x}px`,
              top: `${previewPanel.y}px`,
              width: `${PANEL_WIDTH}px`,
              height: `${PANEL_HEIGHT}px`,
              background: 'rgba(240, 240, 240, 0.15)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              borderRadius: '20px',
              boxShadow: '20px 20px 60px rgba(0, 0, 0, 0.08), -20px -20px 60px rgba(255, 255, 255, 0.1)',
              border: '2px dashed rgba(100, 100, 100, 0.3)',
              zIndex: 19
            }}
          />
        )}

        {/* PLUS BUTTON - Only show when cursor is near edges using plusState */}
        {plusState && (
          <button
            className="global-plus visible"
            style={{
              left: `${plusState.x}px`,
              top: `${plusState.y}px`
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();

              plusButtonInteractionRef.current.isClicking = true;
              plusButtonInteractionRef.current.protectedUntil = Date.now() + 1500;

              // Handle the click - use plusState if available, otherwise use first panel
              const panelId = plusState ? plusState.panelId : panels[0]?.id;
              const side = plusState ? plusState.side : 'right';
              const neighborId = plusState ? plusState.neighborId : null;

              // Only proceed if we have a valid panel ID
              if (panelId) {
                // Use setTimeout to break potential update cycles
                setTimeout(() => {
                  const prevPanelCount = panels.length;
                  handleAddPanel(panelId, side, neighborId);
                  handlePlusMouseLeave();

                  // Log debug info with actual result
                  setTimeout(() => {
                    const newPanelCount = panels.length;
                    if (newPanelCount > prevPanelCount) {
                      logDebug('ADD_PANEL', `New panel successfully added to ${side} of panel ${panelId}`);
                    } else {
                      logDebug('ADD_PANEL', `Failed to add panel - no new panel created`);
                    }
                  }, 100);
                }, 0);
              } else {
                logDebug('ADD_PANEL', `Failed to add panel - no valid panel ID found`);
              }

              setTimeout(() => {
                plusButtonInteractionRef.current.isClicking = false;
              }, 200);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              plusButtonInteractionRef.current.isClicking = true;
            }}
            onMouseUp={() => {
              setTimeout(() => {
                plusButtonInteractionRef.current.isClicking = false;
              }, 100);
            }}
            onMouseEnter={() => {
              if (plusState) {
                handlePlusMouseEnter(plusState.panelId, plusState.side);
              } else if (panels.length > 0) {
                handlePlusMouseEnter(panels[0].id, 'right');
              }
            }}
            onMouseLeave={handlePlusMouseLeave}
            title="Add new panel"
          >
            +
          </button>
        )}

        {/* Grouping Preview Background Panel */}
        {groupingPreview && (
          <div className="grouping-preview-background" style={{
            position: 'absolute',
            left: `${Math.min(...groupingPreview.allPanelIds.map(id => {
              const panel = panels.find(p => p.id === id);
              return panel ? panel.x : 0;
            })) - 20}px`,
            top: `${Math.min(...groupingPreview.allPanelIds.map(id => {
              const panel = panels.find(p => p.id === id);
              return panel ? panel.y : 0;
            })) - 20}px`,
            width: `${Math.max(...groupingPreview.allPanelIds.map(id => {
              const panel = panels.find(p => p.id === id);
              return panel ? panel.x + PANEL_WIDTH : 0;
            })) - Math.min(...groupingPreview.allPanelIds.map(id => {
              const panel = panels.find(p => p.id === id);
              return panel ? panel.x : 0;
            })) + 40}px`,
            height: `${Math.max(...groupingPreview.allPanelIds.map(id => {
              const panel = panels.find(p => p.id === id);
              return panel ? panel.y + PANEL_HEIGHT : 0;
            })) - Math.min(...groupingPreview.allPanelIds.map(id => {
              const panel = panels.find(p => p.id === id);
              return panel ? panel.y : 0;
            })) + 40}px`,
            backgroundColor: 'rgba(100, 150, 255, 0.1)',
            border: '2px dashed rgba(100, 150, 255, 0.3)',
            borderRadius: '20px',
            zIndex: 15,
            pointerEvents: 'none'
          }} />
        )}

        {/* Neumorphic Group Container - Large container wrapping grouped panels */}
        {Object.entries(groups).map(([groupId, group]) => {
          // Find the bounds of all panels in this group
          const groupPanels = panels.filter(p => (group.panelIds || []).includes(p.id));
          if (groupPanels.length === 0) return null;

          // Calculate container dimensions based on current panel count
          const panelCount = groupPanels.length;
          const panelsPerRow = Math.ceil(Math.sqrt(panelCount));
          const rows = Math.ceil(panelCount / panelsPerRow);

          const containerPadding = 60;
          const panelSpacing = 30;
          const scaledPanelWidth = PANEL_WIDTH;
          const scaledPanelHeight = PANEL_HEIGHT;

          const containerWidth = (panelsPerRow * scaledPanelWidth) + ((panelsPerRow - 1) * panelSpacing) + containerPadding;
          const containerHeight = (rows * scaledPanelHeight) + ((rows - 1) * panelSpacing) + containerPadding + 100;

          // Calculate center position from current panel positions
          const minX = Math.min(...groupPanels.map(p => p.x));
          const maxX = Math.max(...groupPanels.map(p => p.x + scaledPanelWidth));
          const minY = Math.min(...groupPanels.map(p => p.y));
          const maxY = Math.max(...groupPanels.map(p => p.y + scaledPanelHeight));

          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;

          const containerLeft = centerX - (containerWidth / 2);
          const containerTop = centerY - (containerHeight / 2);

          // Handle group dragging
          const handleGroupDragStart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Store initial positions of all panels in the group
            const initialPositions = {};
            groupPanels.forEach(panel => {
              initialPositions[panel.id] = { x: panel.x, y: panel.y };
            });
            e.currentTarget.dataset.initialPositions = JSON.stringify(initialPositions);
            e.currentTarget.dataset.startX = e.clientX;
            e.currentTarget.dataset.startY = e.clientY;
            e.currentTarget.dataset.isDragging = 'true';
          };

          const handleGroupDrag = (e) => {
            if (e.currentTarget.dataset.isDragging !== 'true') return;

            const initialPositions = JSON.parse(e.currentTarget.dataset.initialPositions || '{}');
            const startX = parseInt(e.currentTarget.dataset.startX);
            const startY = parseInt(e.currentTarget.dataset.startY);
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // Use the same simple logic as individual panel dragging
            setPanels(prev => prev.map(panel => {
              if (group.panelIds.includes(panel.id)) {
                const initialPos = initialPositions[panel.id];
                if (initialPos) {
                  return {
                    ...panel,
                    x: initialPos.x + deltaX,
                    y: initialPos.y + deltaY
                  };
                }
              }
              return panel;
            }));

            // Update group container position using the same delta approach
            if (group.containerX !== undefined && group.containerY !== undefined) {
              setGroups(prev => ({
                ...prev,
                [groupId]: {
                  ...prev[groupId],
                  containerX: group.containerX + deltaX,
                  containerY: group.containerY + deltaY
                }
              }));
            }
          };

          const handleGroupDragEnd = (e) => {
            e.currentTarget.dataset.isDragging = 'false';
            delete e.currentTarget.dataset.initialPositions;
            delete e.currentTarget.dataset.startX;
            delete e.currentTarget.dataset.startY;
          };

          return (
            <div
              key={groupId}
              className="neumorphic-group-container"
              style={{
                position: 'absolute',
                left: `${containerLeft}px`,
                top: `${containerTop}px`,
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
                backgroundColor: 'rgba(240, 240, 240, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.15), -8px -8px 16px rgba(255, 255, 255, 0.6)',
                zIndex: 15,
                pointerEvents: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                cursor: 'move',
                userSelect: 'none'
              }}
              onMouseDown={handleGroupDragStart}
              onMouseMove={handleGroupDrag}
              onMouseUp={handleGroupDragEnd}
              onMouseLeave={handleGroupDragEnd}
            >
              {/* Group Header - Neumorphic style at top */}
              <div
                style={{
                  position: 'absolute',
                  top: '15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '15px',
                  padding: '12px 20px',
                  boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.8)',
                  zIndex: 26,
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minWidth: '140px',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
              >
                <span style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#059669',
                  fontFamily: 'inherit'
                }}>
                  ${(group.totalEarnings || 0).toFixed(2)}
                </span>
                <span style={{ fontSize: '14px', color: '#666' }}>-</span>
                <input
                  type="text"
                  value={(group.title || 'Project Group').replace(/^\$[\d.]+ - /, '')}
                  onChange={(e) => updateGroupTitle(groupId, `$${(group.totalEarnings || 0).toFixed(2)} - ${e.target.value}`)}
                  style={{
                    fontSize: '16px',
                    border: 'none',
                    background: 'transparent',
                    color: '#374151',
                    fontWeight: '600',
                    outline: 'none',
                    minWidth: '80px',
                    textAlign: 'center',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Group Name"
                />
                {/* Delete Group Button */}
                <button
                  onClick={() => {
                    // Show confirmation dialog
                    if (window.confirm('Delete group or undo grouping?\n\nClick OK to delete group\nClick Cancel to undo grouping')) {
                      // Delete group
                      setGroups(prev => {
                        const newGroups = { ...prev };
                        delete newGroups[groupId];
                        return newGroups;
                      });
                      setGroupVisibility(prev => {
                        const newVisibility = { ...prev };
                        delete newVisibility[groupId];
                        return newVisibility;
                      });
                      logDebug('GROUP_DELETED', `Group ${groupId} deleted`);
                    } else {
                      // Undo grouping - restore individual panels
                      setGroups(prev => {
                        const newGroups = { ...prev };
                        delete newGroups[groupId];
                        return newGroups;
                      });
                      setGroupVisibility(prev => {
                        const newVisibility = { ...prev };
                        delete newVisibility[groupId];
                        return newVisibility;
                      });
                      logDebug('GROUP_UNDONE', `Group ${groupId} undone, panels restored`);
                    }
                  }}
                  style={{
                    background: 'rgba(255, 100, 100, 0.1)',
                    border: '1px solid rgba(255, 100, 100, 0.3)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#d32f2f',
                    marginLeft: '8px',
                    boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.1), -2px -2px 4px rgba(255, 255, 255, 0.8)'
                  }}
                  title="Delete group or undo grouping"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Canvas library overlay */}
      {showCanvasLibrary && (
        <div className="canvas-library" style={{
          position: 'fixed',
          top: '120px',
          left: showSettings ? '250px' : '20px',
          width: '260px',
          background: 'rgba(240,240,240,0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '10px',
          boxShadow: '8px 8px 16px rgba(0,0,0,0.15), -8px -8px 16px rgba(255,255,255,0.6)',
          zIndex: 50,
          transition: 'left 0.3s ease-in-out'
        }}>
          <div style={{ fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Canvases</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '60vh', overflowY: 'auto' }}>
            {canvases.map(c => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  background: activeCanvasId === c.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer'
                }}
                onClick={() => openCanvas(c.id)}
              >
                {editingCanvasId === c.id ? (
                  <input
                    ref={inputRef}
                    value={editingCanvasName}
                    onChange={e => setEditingCanvasName(e.target.value)}
                    onBlur={() => {
                      if (editingCanvasName.trim()) {
                        setCanvases(prev => prev.map(cc =>
                          cc.id === c.id ? { ...cc, name: editingCanvasName.trim() } : cc
                        ));
                      }
                      setEditingCanvasId(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (editingCanvasName.trim()) {
                          setCanvases(prev => prev.map(cc =>
                            cc.id === c.id ? { ...cc, name: editingCanvasName.trim() } : cc
                          ));
                        }
                        setEditingCanvasId(null);
                      } else if (e.key === 'Escape') {
                        setEditingCanvasId(null);
                      }
                    }}
                    style={{
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 600,
                      width: '100%',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '2px 4px'
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span
                    style={{ color: '#374151', fontSize: '12px', fontWeight: 600 }}
                    onDoubleClick={e => {
                      e.stopPropagation();
                      setEditingCanvasId(c.id);
                      setEditingCanvasName(c.name);
                    }}
                  >
                    {c.name}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className="control-button"
                    style={{ padding: '4px 6px' }}
                    title="Delete"
                    onClick={e => {
                      e.stopPropagation();
                      deleteCanvas(c.id);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Window */}
      <DebugWindow
        isVisible={showDebug}
        onToggle={() => setShowDebug(false)}
        debugLogs={debugLogs}
      />

      {/* Settings Window */}
      {showSettings && (
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

          {/* Future Settings Placeholder */}
          <div style={{
            padding: '15px',
            backgroundColor: 'rgba(255,255,255,0.6)',
            borderRadius: '8px',
            border: '1px dashed rgba(100,100,100,0.3)',
            textAlign: 'center',
            color: '#666',
            fontSize: '12px'
          }}>
            More settings coming soon...
          </div>
        </div>
      )}
    </div>
  );
}
