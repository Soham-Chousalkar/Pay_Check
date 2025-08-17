// Constants
export const PANEL_WIDTH = 300;
export const PANEL_HEIGHT = 200;
export const PANEL_GAP = 16;
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.1;
export const EDGE_TRIGGER_RADIUS = 30;
export const EDGE_HYSTERESIS = 10; 
export const EDGE_LOCK_TIMEOUT = 1000;
export const CLICK_PROTECTION_TIMEOUT = 1500;
export const STICK_THRESHOLD = 16;
export const STUCK_EPSILON = 2; 
export const THROTTLE_DELAY = 30;
export const POSITION_CHANGE_THRESHOLD = 8;

/**
 * Check if two rectangles overlap
 * @param {Object} a - First rectangle {x, y, width, height}
 * @param {Object} b - Second rectangle {x, y, width, height}
 * @returns {boolean} - True if rectangles overlap
 */
export function rectsOverlap(a, b) {
  return !(
    a.x + PANEL_WIDTH <= b.x || 
    b.x + PANEL_WIDTH <= a.x || 
    a.y + PANEL_HEIGHT <= b.y || 
    b.y + PANEL_HEIGHT <= a.y
  );
}

/**
 * Calculate vertical overlap between two panels
 */
export function verticalOverlapAmount(a, b) {
  return Math.max(0, 
    Math.min(a.y + PANEL_HEIGHT, b.y + PANEL_HEIGHT) - 
    Math.max(a.y, b.y)
  );
}

/**
 * Calculate horizontal overlap between two panels
 */
export function horizontalOverlapAmount(a, b) {
  return Math.max(0, 
    Math.min(a.x + PANEL_WIDTH, b.x + PANEL_WIDTH) - 
    Math.max(a.x, b.x)
  );
}

/**
 * Check if panels are stuck horizontally (side by side)
 */
export function isStuckHorizontal(a, b) {
  const rightToLeft = Math.abs((a.x + PANEL_WIDTH + PANEL_GAP) - b.x) <= STUCK_EPSILON;
  const leftToRight = Math.abs((b.x + PANEL_WIDTH + PANEL_GAP) - a.x) <= STUCK_EPSILON;
  return (rightToLeft || leftToRight) && verticalOverlapAmount(a, b) > 0;
}

/**
 * Check if panels are stuck vertically (one above the other)
 */
export function isStuckVertical(a, b) {
  const bottomToTop = Math.abs((a.y + PANEL_HEIGHT + PANEL_GAP) - b.y) <= STUCK_EPSILON;
  const topToBottom = Math.abs((b.y + PANEL_HEIGHT + PANEL_GAP) - a.y) <= STUCK_EPSILON;
  return (bottomToTop || topToBottom) && horizontalOverlapAmount(a, b) > 0;
}

/**
 * Simple debounce function to prevent rapid state changes
 */
export function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}
