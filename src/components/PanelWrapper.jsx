import { useRef, useEffect, useState } from "react";
import EarningsPanel from "./EarningsPanel";
import { PANEL_WIDTH, PANEL_HEIGHT } from "../utils/panelUtils";

/**
 * PanelWrapper - Wraps panels with dragging functionality
 */
function PanelWrapper({ panel, onDragStart, onDrag, onDragEnd, useRetroStyleGlobal, onStateChange, onDelete, scale }) {
  const wrapperRef = useRef(null);
  // Use refs instead of state for dragging to avoid re-render loops
  const dragRef = useRef({
    isDragging: false,
    initialMouseX: 0,
    initialMouseY: 0,
    initialPanelX: 0,
    initialPanelY: 0
  });

  // Store the scale in a ref to avoid recomputation during dragging
  const scaleRef = useRef(scale);

  // Update scaleRef when scale prop changes
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Set up and clean up dragging event handlers
  const handleMouseDown = (e) => {
    // Ignore if clicking on interactive elements
    const interactive = e.target.closest('input, button, [contenteditable="true"]');
    if (interactive) return;

    // Prevent default to avoid text selection
    e.preventDefault();

    // Disable text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';

    // Store initial positions in ref (no state updates)
    dragRef.current = {
      isDragging: true,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
      initialPanelX: panel.x,
      initialPanelY: panel.y
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Notify parent
    onDragStart();
  };

  const handleMouseMove = (e) => {
    // Check ref instead of state
    if (!dragRef.current.isDragging) return;

    // Calculate new position using initial values stored in ref
    const deltaX = (e.clientX - dragRef.current.initialMouseX) / scaleRef.current;
    const deltaY = (e.clientY - dragRef.current.initialMouseY) / scaleRef.current;

    // Apply deltas to initial position
    const newX = dragRef.current.initialPanelX + deltaX;
    const newY = dragRef.current.initialPanelY + deltaY;

    // Update panel position
    onDrag(panel.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    // Update ref without state changes
    dragRef.current.isDragging = false;

    // Re-enable text selection
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.mozUserSelect = '';

    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Notify parent
    onDragEnd(panel.id);
  };

  // State for showing delete button
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const deleteButtonRef = useRef(null);

  // Handler for delete panel button
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Check if the panel has been edited (has state data)
    if (panel.state &&
      (panel.state.title !== 'PayTracker' ||
        panel.state.hourlyRate ||
        panel.state.accumulatedSeconds > 0)) {
      setShowConfirmDelete(true);
    } else {
      // Delete without confirmation if not edited
      handlePanelDelete(panel.id);
    }
  };

  // For deleting panels we use the onDelete prop
  const handlePanelDelete = (id) => {
    onDelete(id);
    setShowConfirmDelete(false);
  };

  return (
    <div
      ref={wrapperRef}
      className="panel-wrapper"
      style={{
        left: `${panel.x}px`,
        top: `${panel.y}px`,
        width: `${PANEL_WIDTH}px`,
        height: `${PANEL_HEIGHT}px`
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => {
        // Only show delete button when cursor is near top-right corner
        const rect = wrapperRef.current.getBoundingClientRect();
        const topRightX = rect.right - 30;
        const topRightY = rect.top + 30;
        const distance = Math.sqrt(
          Math.pow(e.clientX - topRightX, 2) +
          Math.pow(e.clientY - topRightY, 2)
        );

        // Show button only when cursor is within 40px of the top-right corner
        setShowDeleteButton(distance < 40);
      }}
      onMouseLeave={() => {
        setShowDeleteButton(false);
        setShowConfirmDelete(false);
      }}
    >
      <div className="main-panel smooth-transition relative mx-auto w-full h-full">
        {/* Delete button */}
        {showDeleteButton && (
          <button
            ref={deleteButtonRef}
            className="panel-delete-btn"
            onClick={handleDeleteClick}
            onMouseEnter={() => setShowDeleteButton(true)}
            title="Delete panel"
          >
            ✕
          </button>
        )}

        {/* Delete confirmation modal */}
        {showConfirmDelete && (
          <div className="delete-confirm-modal">
            <p>Delete this panel?</p>
            <div className="delete-confirm-buttons">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePanelDelete(panel.id);
                }}
              >
                Yes
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDelete(false);
                }}
              >
                No
              </button>
            </div>
          </div>
        )}

        <EarningsPanel
          useRetroStyleGlobal={useRetroStyleGlobal}
          onStateChange={(state) => onStateChange(panel.id, state)}
        />
      </div>
    </div>
  );
}

export default PanelWrapper;
