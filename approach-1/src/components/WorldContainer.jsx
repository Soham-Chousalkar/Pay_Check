import React, { useState } from 'react'
import PanelWrapper from './PanelWrapper'
import TileTypeSelector from './TileTypeSelector'
import { PANEL_WIDTH, PANEL_HEIGHT } from '../utils/panelUtils'


const WorldContainer = ({
  panels,
  groups,
  groupVisibility,
  scale,
  worldRef,
  handleDragStart,
  handleDrag,
  handleDragEnd,
  handlePanelStateChange,
  handlePanelDelete,
  useRetroStyle,
  panelOpacity,
  previewPanel,
  plusState,
  plusButtonInteractionRef,
  handlePlusMouseEnter,
  handlePlusMouseLeave,
  handleAddPanel,
  groupingPreview,
  setGroupingPreview,
  detectGroupingOpportunity,
  createGroup,
  setGroups,
  setGroupVisibility,
  recalculateGroupContainer,
  updateGroupTitle,
  logDebug
}) => {
  const [tileSelector, setTileSelector] = useState(null);

  return (

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
              const finalPanel = panels.find(p => p.id === panelId);
              if (finalPanel) {
                const currentGroup = Object.values(groups).find(g => g.panelIds.includes(panelId));
                if (currentGroup && currentGroup.containerX !== undefined && currentGroup.containerY !== undefined) {
                  const padding = 20, header = 60, spacing = 30;
                  const originX = currentGroup.containerX + padding;
                  const originY = currentGroup.containerY + padding + header;
                  const stepX = PANEL_WIDTH + spacing;
                  const stepY = PANEL_HEIGHT + spacing;
                  const col = Math.round((finalPanel.x - originX) / stepX);
                  const row = Math.round((finalPanel.y - originY) / stepY);
                  const snappedX = originX + col * stepX;
                  const snappedY = originY + row * stepY;
                  const maxX = currentGroup.containerX + currentGroup.containerWidth - PANEL_WIDTH - padding;
                  const maxY = currentGroup.containerY + currentGroup.containerHeight - PANEL_HEIGHT - padding;
                  const x = Math.max(originX, Math.min(snappedX, maxX));
                  const y = Math.max(originY, Math.min(snappedY, maxY));
                  // Update panel position through parent component
                }
                handleDragEnd(panelId);
              }

              if (groupingPreview && groupingPreview.draggedPanelId === panelId) {
                createGroup(groupingPreview);
                setGroupingPreview(null);
              }
            }}
            useRetroStyleGlobal={useRetroStyle}
            onStateChange={handlePanelStateChange}
            onDelete={handlePanelDelete}
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

            plusButtonInteractionRef.current.protectedUntil = Date.now() + 1500;

            // Handle the click - Show selector
            const panelId = plusState ? plusState.panelId : panels[0]?.id;
            const side = plusState ? plusState.side : 'right';
            const neighborId = plusState ? plusState.neighborId : null;

            if (panelId) {
              setTileSelector({
                x: e.clientX,
                y: e.clientY,
                targetParams: { panelId, side, neighborId }
              });
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
        let activeGroupEl = null;
        const handleGroupDragStart = (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Store initial positions of all panels in the group
          const initialPositions = {};
          groupPanels.forEach(panel => {
            initialPositions[panel.id] = { x: panel.x, y: panel.y };
          });
          activeGroupEl = e.currentTarget;
          activeGroupEl.dataset.initialPositions = JSON.stringify(initialPositions);
          activeGroupEl.dataset.startX = e.clientX;
          activeGroupEl.dataset.startY = e.clientY;
          activeGroupEl.dataset.isDragging = 'true';
          document.addEventListener('mousemove', handleGroupDrag);
          document.addEventListener('mouseup', handleGroupDragEnd);
        };

        const handleGroupDrag = (e) => {
          if (!activeGroupEl || activeGroupEl.dataset.isDragging !== 'true') return;

          const initialPositions = JSON.parse(activeGroupEl.dataset.initialPositions || '{}');
          const startX = parseInt(activeGroupEl.dataset.startX);
          const startY = parseInt(activeGroupEl.dataset.startY);
          const deltaX = (e.clientX - startX) / scale;
          const deltaY = (e.clientY - startY) / scale;

          // Update all panels in the group
          groupPanels.forEach(panel => {
            const initialPos = initialPositions[panel.id];
            if (initialPos) {
              const newX = initialPos.x + deltaX;
              const newY = initialPos.y + deltaY;
              handleDrag(panel.id, { x: newX, y: newY });
            }
          });
        };

        const handleGroupDragEnd = () => {
          if (!activeGroupEl) return;
          activeGroupEl.dataset.isDragging = 'false';
          delete activeGroupEl.dataset.initialPositions;
          delete activeGroupEl.dataset.startX;
          delete activeGroupEl.dataset.startY;
          document.removeEventListener('mousemove', handleGroupDrag);
          document.removeEventListener('mouseup', handleGroupDragEnd);
          activeGroupEl = null;
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
            onMouseUp={handleGroupDragEnd}
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
      {/* Tile Type Selector */}
      {tileSelector && (
        <TileTypeSelector
          x={tileSelector.x}
          y={tileSelector.y}
          onSelect={(type) => {
            const { panelId, side, neighborId } = tileSelector.targetParams;
            handleAddPanel(panelId, side, neighborId, type);
            handlePlusMouseLeave(); // Clear the plus state
            setTileSelector(null);
          }}
          onClose={() => setTileSelector(null)}
        />
      )}
    </div>
  )
}


export default WorldContainer