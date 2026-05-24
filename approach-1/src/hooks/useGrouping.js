import { useState, useCallback, useEffect } from 'react'
import { PANEL_WIDTH, PANEL_HEIGHT, shouldGroupPanels } from '../utils/panelUtils'

export function useGrouping(panels, setPanels, calculateGroupEarnings) {
  const [groups, setGroups] = useState({})
  const [groupVisibility, setGroupVisibility] = useState({})
  const [groupingPreview, setGroupingPreview] = useState(null)

  // Update group earnings when panels change
  useEffect(() => {
    setGroups(prevGroups => {
      const updatedGroups = { ...prevGroups }
      
      Object.entries(prevGroups).forEach(([groupId, group]) => {
        const totalEarnings = calculateGroupEarnings(group.panelIds)
        if (totalEarnings !== group.totalEarnings) {
          updatedGroups[groupId] = {
            ...group,
            totalEarnings,
            title: `$${totalEarnings.toFixed(2)} - ${(group.title || 'Project Group').replace(/^\$[\d.]+ - /, '')}`
          }
        }
      })
      
      return updatedGroups
    })
  }, [panels, calculateGroupEarnings])

  // Function to detect overlapping panels for grouping
  const detectGroupingOpportunity = useCallback((draggedPanelId, draggedPanelPos) => {
    const draggedPanel = panels.find(p => p.id === draggedPanelId)
    if (!draggedPanel) return null

    // Create a complete panel object with position and dimensions
    const draggedPanelWithDimensions = {
      x: draggedPanelPos.x,
      y: draggedPanelPos.y,
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT
    }

    // First, check if the dragged panel should be added to an existing group
    for (const [groupId, group] of Object.entries(groups)) {
      const groupPanels = panels.filter(p => group.panelIds.includes(p.id))

      // Check if dragged panel overlaps with any panel in this group
      for (const groupPanel of groupPanels) {
        const shouldGroup = shouldGroupPanels(draggedPanelWithDimensions, groupPanel)
        if (shouldGroup) {
          // Add panel to existing group
          const allPanelIds = [...group.panelIds, draggedPanelId]
          const totalEarnings = calculateGroupEarnings(allPanelIds)

          return {
            type: 'addToExisting',
            groupId: groupId,
            draggedPanelId,
            allPanelIds,
            totalEarnings,
            centerX: (draggedPanelPos.x + groupPanel.x) / 2,
            centerY: (draggedPanelPos.y + groupPanel.y) / 2
          }
        }
      }
    }

    // If not adding to existing group, check for creating new group with overlapping panels
    const overlappingPanels = panels.filter(panel => {
      if (panel.id === draggedPanelId) return false

      // Don't include panels that already belong to groups
      const isInGroup = Object.values(groups).some(group =>
        group.panelIds.includes(panel.id)
      )
      if (isInGroup) return false

      const shouldGroup = shouldGroupPanels(draggedPanelWithDimensions, panel)

      // Use 25% overlap threshold for better grouping
      return shouldGroup
    })

    if (overlappingPanels.length > 0) {
      const allPanelIds = [draggedPanelId, ...overlappingPanels.map(p => p.id)]
      const totalEarnings = calculateGroupEarnings(allPanelIds)

      return {
        type: 'createNew',
        draggedPanelId,
        overlappingPanelIds: overlappingPanels.map(p => p.id),
        allPanelIds,
        totalEarnings,
        centerX: (draggedPanelPos.x + overlappingPanels[0].x) / 2,
        centerY: (draggedPanelPos.y + overlappingPanels[0].y) / 2
      }
    }

    return null
  }, [panels, groups, calculateGroupEarnings])

  // Function to rearrange panels within a group
  const rearrangeGroupPanels = useCallback((group) => {
    setPanels(prev => {
      const panelsToGroup = prev.filter(p => group.panelIds.includes(p.id))
      if (panelsToGroup.length === 0) return prev

      // Calculate group center position from original panel positions
      const centerX = (Math.min(...panelsToGroup.map(p => p.x)) + Math.max(...panelsToGroup.map(p => p.x + PANEL_WIDTH))) / 2
      const centerY = (Math.min(...panelsToGroup.map(p => p.y)) + Math.max(...panelsToGroup.map(p => p.y + PANEL_HEIGHT))) / 2

      // Calculate grid layout - more organized grid
      const panelCount = panelsToGroup.length
      const panelsPerRow = Math.ceil(Math.sqrt(panelCount))
      const rows = Math.ceil(panelCount / panelsPerRow)

      // Panel spacing and scaling - keep panels at full size for better usability
      const spacing = 30
      const scaledPanelWidth = PANEL_WIDTH
      const scaledPanelHeight = PANEL_HEIGHT

      // Calculate total grid dimensions
      const gridWidth = (panelsPerRow * scaledPanelWidth) + ((panelsPerRow - 1) * spacing)
      const gridHeight = (rows * scaledPanelHeight) + ((rows - 1) * spacing)

      // Calculate starting position to center the grid
      const startX = centerX - (gridWidth / 2)
      const startY = centerY - (gridHeight / 2) + 40 // Offset for header

      return prev.map(panel => {
        if (group.panelIds.includes(panel.id)) {
          const panelIndex = group.panelIds.indexOf(panel.id)
          const row = Math.floor(panelIndex / panelsPerRow)
          const col = panelIndex % panelsPerRow

          return {
            ...panel,
            x: startX + (col * (scaledPanelWidth + spacing)),
            y: startY + (row * (scaledPanelHeight + spacing))
          }
        }
        return panel
      })
    })
  }, [])

  // Function to create a group when panels are dropped
  const createGroup = useCallback((groupingData) => {
    if (groupingData.type === 'addToExisting') {
      // Add panel to existing group
      const existingGroup = groups[groupingData.groupId]
      if (!existingGroup) return null

      const updatedGroup = {
        ...existingGroup,
        panelIds: [...existingGroup.panelIds, groupingData.draggedPanelId],
        totalEarnings: groupingData.totalEarnings,
        title: `$${groupingData.totalEarnings.toFixed(2)} - ${(existingGroup.title || 'Project Group').replace(/^\$[\d.]+ - /, '')}`
      }

      setGroups(prev => ({ ...prev, [groupingData.groupId]: updatedGroup }))

      // Rearrange panels in the updated group
      rearrangeGroupPanels(updatedGroup)
      setTimeout(() => recalculateGroupContainer(groupingData.groupId), 0)

      return groupingData.groupId
    } else {
      // Create new group
      const groupId = `group-${Date.now()}`
      const newGroup = {
        id: groupId,
        panelIds: groupingData.allPanelIds,
        totalEarnings: groupingData.totalEarnings,
        title: `$${groupingData.totalEarnings.toFixed(2)} - Project Group`,
        createdAt: Date.now()
      }

      setGroups(prev => ({ ...prev, [groupId]: newGroup }))
      setGroupVisibility(prev => ({ ...prev, [groupId]: true }))

      // Rearrange panels in the new group
      rearrangeGroupPanels(newGroup)
      setTimeout(() => recalculateGroupContainer(groupId), 0)

      return groupId
    }
  }, [groups, rearrangeGroupPanels])

  // Function to recalculate group container dimensions
  const recalculateGroupContainer = useCallback((groupId) => {
    const group = groups[groupId]
    if (!group) return

    const groupPanels = panels.filter(p => group.panelIds.includes(p.id))
    if (groupPanels.length === 0) return

    // Calculate new container dimensions based on current panel count
    const panelCount = groupPanels.length
    const panelsPerRow = Math.ceil(Math.sqrt(panelCount))
    const rows = Math.ceil(panelCount / panelsPerRow)

    const containerPadding = 60
    const panelSpacing = 30
    const scaledPanelWidth = PANEL_WIDTH
    const scaledPanelHeight = PANEL_HEIGHT

    const containerWidth = (panelsPerRow * scaledPanelWidth) + ((panelsPerRow - 1) * panelSpacing) + containerPadding
    const containerHeight = (rows * scaledPanelHeight) + ((rows - 1) * panelSpacing) + containerPadding + 100

    // Calculate center position from current panel positions
    const minX = Math.min(...groupPanels.map(p => p.x))
    const maxX = Math.max(...groupPanels.map(p => p.x + scaledPanelWidth))
    const minY = Math.min(...groupPanels.map(p => p.y))
    const maxY = Math.max(...groupPanels.map(p => p.y + scaledPanelHeight))

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    const containerLeft = centerX - (containerWidth / 2)
    const containerTop = centerY - (containerHeight / 2)

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
    }))
  }, [groups, panels])

  // Function to toggle group visibility
  const toggleGroupVisibility = useCallback((groupId) => {
    setGroupVisibility(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }, [])

  // Function to update group title
  const updateGroupTitle = useCallback((groupId, newTitle) => {
    setGroups(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        title: newTitle
      }
    }))
  }, [])

  return {
    groups,
    setGroups,
    groupVisibility,
    setGroupVisibility,
    groupingPreview,
    setGroupingPreview,
    detectGroupingOpportunity,
    createGroup,
    recalculateGroupContainer,
    toggleGroupVisibility,
    updateGroupTitle
  }
}

