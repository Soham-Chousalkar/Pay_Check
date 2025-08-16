import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo, memo } from "react";

const PANEL_WIDTH = 300;
const PANEL_HEIGHT = 200;
const PANEL_GAP = 16;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;
const EDGE_TRIGGER_RADIUS = 32;
const EDGE_HYSTERESIS = 10; // Increased buffer to prevent flickering at boundaries
const EDGE_LOCK_TIMEOUT = 500; // ms to lock an edge after selection to prevent rapid toggles
const STICK_THRESHOLD = 16;
const PLUS_BTN_SIZE = 24;
const STUCK_EPSILON = 2; // tolerance for considering panels "stuck"
const THROTTLE_DELAY = 100; // ms delay for throttling mouse movement
const POSITION_CHANGE_THRESHOLD = 8; // Minimum pixel change required to update button position

const RetroDigitalNumber = memo(({ value, className = "", showDollarSign = false }) => {
  const digits = useMemo(() => String(value).split(''), [value]);

  return (
    <div className={`retro-digital ${className}`}>
      {showDollarSign && (
        <img
          src="/Dollar-sign.png"
          alt="$"
          className="inline-block w-4 h-4 mr-1 align-middle"
          style={{ objectFit: 'contain', maxWidth: '16px', maxHeight: '16px' }}
        />
      )}
      {digits.map((char, index) => {
        if (char === '.') {
          return (
            <span key={`${char}-${index}`} className="retro-digit" data-char=".">
              <span className="segment segment-char"></span>
              <span style={{ visibility: 'hidden' }}>{char}</span>
            </span>
          );
        }

        if (/[0-9]/.test(char)) {
          return (
            <span key={`${char}-${index}`} className="retro-digit" data-digit={char}>
              <span className="segment segment-a"></span>
              <span className="segment segment-b"></span>
              <span className="segment segment-c"></span>
              <span className="segment segment-d"></span>
              <span className="segment segment-e"></span>
              <span className="segment segment-f"></span>
              <span className="segment segment-g"></span>
              <span style={{ visibility: 'hidden' }}>{char}</span>
            </span>
          );
        }

        return (
          <span key={`${char}-${index}`} className="retro-digit" data-char={char}>
            <span className="segment segment-char"></span>
            <span style={{ visibility: 'hidden' }}>{char}</span>
          </span>
        );
      })}
    </div>
  );
});
RetroDigitalNumber.displayName = 'RetroDigitalNumber';

const RetroDigitalText = memo(({ text, className = "" }) => {
  const characters = useMemo(() => text.split(''), [text]);

  return (
    <div className={`retro-digital ${className}`}>
      {characters.map((char, index) => {
        if (/[0-9]/.test(char)) {
          return (
            <span key={`${char}-${index}`} className="retro-digit" data-digit={char}>
              <span className="segment segment-a"></span>
              <span className="segment segment-b"></span>
              <span className="segment segment-c"></span>
              <span className="segment segment-d"></span>
              <span className="segment segment-e"></span>
              <span className="segment segment-f"></span>
              <span className="segment segment-g"></span>
              <span style={{ visibility: 'hidden' }}>{char}</span>
            </span>
          );
        }

        return (
          <span key={`${char}-${index}`} className="retro-digit" data-char={char}>
            <span className="segment segment-char"></span>
            <span style={{ visibility: 'hidden' }}>{char}</span>
          </span>
        );
      })}
    </div>
  );
});
RetroDigitalText.displayName = 'RetroDigitalText';

function formatTimeOnly(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${hh}:${mi}`;
}

function formatDateOnly(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateTime(val) {
  const ms = Date.parse(val.replace(" ", "T"));
  return isNaN(ms) ? null : ms;
}

function EarningsPanel({ panelTitleDefault = "PayTracker", useRetroStyleGlobal = true, onStateChange }) {
  const [isRunning, setIsRunning] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(null);
  const [rateInput, setRateInput] = useState("");
  const [earnings, setEarnings] = useState(0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [isEditingCounter, setIsEditingCounter] = useState(false);
  const [title, setTitle] = useState(panelTitleDefault);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [useRetroStyle, setUseRetroStyle] = useState(useRetroStyleGlobal);
  const [isEditingTimes, setIsEditingTimes] = useState(false);
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  const titleInputRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  const dollarsPerSecond = hourlyRate ? hourlyRate / 3600 : 0;

  const startTimer = useCallback((rateOverride) => {
    const rate = rateOverride ?? hourlyRate;
    if (!rate || rate <= 0) return;
    if (!startTime) setStartTime(Date.now());
    if (startTimeRef.current === null) startTimeRef.current = performance.now();
    setIsRunning(true);
    setEndTime(null);
  }, [hourlyRate, startTime]);

  const pauseTimer = useCallback(() => {
    if (!isRunning) return;
    if (startTimeRef.current !== null) {
      const now = performance.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      setAccumulatedSeconds((prev) => prev + elapsed);
      startTimeRef.current = null;
    }
    setIsRunning(false);
    setEndTime(Date.now());
  }, [isRunning]);

  const toggleTimer = useCallback(() => {
    if (isRunning) pauseTimer();
    else startTimer();
  }, [isRunning, pauseTimer, startTimer]);

  // Sync panel style with global toggle
  useEffect(() => {
    setUseRetroStyle(useRetroStyleGlobal);
  }, [useRetroStyleGlobal]);

  // Keep caret at end while editing to avoid reverse typing
  useLayoutEffect(() => {
    if (!isEditingTitle || !titleInputRef.current) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(titleInputRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [title, isEditingTitle]);

  // Helpers for time editing
  const formatDateTime = (ms) => {
    if (!ms) return "";
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  };

  const parseUserDateTime = (val, baseMs) => {
    if (!val || !val.trim()) return null;
    const s = val.trim().toLowerCase();
    // Contains date part
    if (/\d{4}-\d{2}-\d{2}/.test(s)) {
      const iso = s.replace(/\s+/, 'T');
      const t = Date.parse(iso);
      return isNaN(t) ? null : t;
    }
    // Time only e.g. 3pm, 03:30, 11:45 am
    const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    let mi = m[2] ? parseInt(m[2], 10) : 0;
    const ampm = m[3];
    if (ampm) {
      if (hh === 12) hh = 0;
      if (ampm === 'pm') hh += 12;
    }
    const base = new Date(baseMs || Date.now());
    base.setHours(hh, mi, 0, 0);
    return base.getTime();
  };

  const openTimeEditor = () => {
    setIsEditingTimes(true);
    setStartInput(formatDateTime(startTime ?? Date.now()));
    setEndInput(endTime ? formatDateTime(endTime) : "");
  };

  const cancelTimeEditor = () => {
    setIsEditingTimes(false);
  };

  const saveTimeEditor = () => {
    const newStart = parseUserDateTime(startInput, startTime ?? Date.now());
    let newEnd = endInput ? parseUserDateTime(endInput, endTime ?? (startTime ?? Date.now())) : null;
    if (!newStart) { setIsEditingTimes(false); return; }
    if (newEnd != null && newEnd < newStart) {
      // roll end forward by days until >= start
      const oneDay = 24 * 60 * 60 * 1000;
      while (newEnd < newStart) newEnd += oneDay;
    }

    setStartTime(newStart);
    if (newEnd != null) setEndTime(newEnd); else setEndTime(null);

    if (isRunning) {
      if (newEnd != null) {
        // If an end is provided while running, pause at that end
        const totalSeconds = Math.max(0, (newEnd - newStart) / 1000);
        setAccumulatedSeconds(totalSeconds);
        setIsRunning(false);
        startTimeRef.current = null;
      } else {
        const nowMs = Date.now();
        const totalSeconds = Math.max(0, (nowMs - newStart) / 1000);
        setAccumulatedSeconds(totalSeconds);
        startTimeRef.current = performance.now();
      }
    } else {
      const effectiveEnd = newEnd ?? Date.now();
      const totalSeconds = Math.max(0, (effectiveEnd - newStart) / 1000);
      setAccumulatedSeconds(totalSeconds);
    }

    setIsEditingTimes(false);
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(titleInputRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      const now = performance.now();
      const live = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
      const totalSeconds = accumulatedSeconds + live;
      setEarnings(totalSeconds * dollarsPerSecond);
      if (onStateChange) {
        onStateChange({
          isRunning: true,
          hourlyRate,
          accumulatedSeconds,
          startTime,
          endTime,
        });
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, accumulatedSeconds, dollarsPerSecond]);

  useEffect(() => {
    if (hourlyRate != null) {
      const now = performance.now();
      const live = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
      const totalSeconds = accumulatedSeconds + live;
      setEarnings(totalSeconds * (hourlyRate / 3600));
    }
    if (onStateChange) {
      onStateChange({
        isRunning,
        hourlyRate,
        accumulatedSeconds,
        startTime,
        endTime,
      });
    }
  }, [hourlyRate, accumulatedSeconds]);

  const handleRateSubmit = (e) => {
    if (e.key === "Enter") {
      const parsed = parseFloat(rateInput);
      if (!isFinite(parsed) || parsed <= 0) return;
      setHourlyRate(parsed);
      setEarnings(0);
      setAccumulatedSeconds(0);
      setStartTime(Date.now());
      setEndTime(null);
      startTimeRef.current = null;
      startTimer(parsed);
    }
  };

  const handleCounterEdit = (e) => {
    if (e.key === "Enter") {
      const now = Date.now();
      setStartTime(now);
      setEarnings(0);
      setAccumulatedSeconds(0);
      setEndTime(null);
      if (isRunning) {
        startTimeRef.current = performance.now();
      } else {
        startTimeRef.current = null;
      }
      setIsEditingCounter(false);
    } else if (e.key === "Escape") {
      setIsEditingCounter(false);
    }
  };

  const timeSinceStart = useMemo(() => {
    if (!startTime) return "";
    const diff = Date.now() - startTime;
    const minutes = Math.max(0, Math.floor(diff / 60000));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours >= 1 ? `${hours}hr ${mins}m since clock in` : `${mins}m since clock in`;
  }, [startTime]);

  const getTimeDisplay = () => {
    if (!startTime) return null;
    const showDate = (() => {
      if (!startTime) return false;
      if (isRunning) {
        const startDate = formatDateOnly(startTime);
        const nowDate = formatDateOnly(Date.now());
        return startDate !== nowDate;
      } else {
        if (!endTime) return false;
        const startDate = formatDateOnly(startTime);
        const endDate = formatDateOnly(endTime);
        return startDate !== endDate;
      }
    })();
    if (showDate) {
      if (isRunning) {
        return { line1: `${formatDateOnly(startTime)} ${formatTimeOnly(startTime)}`, line2: null };
      } else {
        return { line1: `${formatDateOnly(startTime)} ${formatTimeOnly(startTime)}`, line2: `${formatDateOnly(endTime)} ${formatTimeOnly(endTime)}` };
      }
    } else {
      if (isRunning) {
        return { line1: formatTimeOnly(startTime), line2: null };
      } else {
        return { line1: `${formatTimeOnly(startTime)} – ${formatTimeOnly(endTime)}`, line2: null };
      }
    }
  };

  const timeDisplay = useMemo(() => getTimeDisplay(), [startTime, endTime, isRunning]);

  return (
    <div className="p-5 h-full flex flex-col justify-between">
      <div className="text-center mb-4">
        <h1
          ref={titleInputRef}
          contentEditable={isEditingTitle}
          suppressContentEditableWarning
          onInput={(e) => setTitle(e.currentTarget.textContent)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); setIsEditingTitle(false); }
            else if (e.key === 'Escape') { e.preventDefault(); setIsEditingTitle(false); }
          }}
          onBlur={() => setIsEditingTitle(false)}
          onClick={() => !isEditingTitle && setIsEditingTitle(true)}
          className={`text-gray-800 font-bold text-xl tracking-wide px-6 transition-colors ${isEditingTitle ? 'cursor-text outline-none' : 'cursor-pointer hover:text-gray-600'}`}
          style={{ outline: isEditingTitle ? 'none' : undefined }}
        >
          {title}
        </h1>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {!isRunning && !hourlyRate ? (
          <div className="mb-8 px-5 relative">
            <input
              type="number"
              step="0.01"
              placeholder="Enter hourly rate"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              onKeyDown={handleRateSubmit}
              className="w-full text-center text-lg text-gray-500 bg-transparent border-none outline-none placeholder-gray-500"
            />
          </div>
        ) : (
          <div className="text-center mb-8 px-5 relative">
            <div className="text-center mb-3">
              {useRetroStyle ? (
                <RetroDigitalNumber value={earnings.toFixed(5)} className="text-2xl" showDollarSign={true} />
              ) : (
                <div className="text-2xl font-bold text-gray-800">${earnings.toFixed(5)}</div>
              )}
            </div>
            <button
              onClick={toggleTimer}
              className="control-button p-4 rounded-full text-gray-800 hover:scale-110 transition-transform absolute"
              style={{ right: '20px', top: '50%', transform: 'translateY(-50%)' }}
              disabled={!hourlyRate}
            >
              {isRunning ? (<div className="pause-icon"></div>) : (<div className="play-icon"></div>)}
            </button>
          </div>
        )}

        {hourlyRate && (
          <div className="text-center mb-4 px-5">
            <div className="text-xs text-gray-700">
              {useRetroStyle ? (
                <>
                  <RetroDigitalNumber value={hourlyRate} className="text-xs" showDollarSign={true} />
                  <RetroDigitalText text="/hr" className="text-xs ml-1" />
                </>
              ) : (
                <span className="text-xs text-gray-700">${hourlyRate}/hr</span>
              )}
            </div>
          </div>
        )}

        {timeDisplay && !isEditingTimes && (
          <div className="text-center px-5 mb-2 cursor-pointer" onClick={openTimeEditor} title="Click to edit start/end time">
            <div className="text-xs text-gray-600 mb-1">
              {useRetroStyle ? (
                <RetroDigitalText text={timeDisplay.line1} className="text-xs" />
              ) : (
                <span className="text-xs text-gray-600">{timeDisplay.line1}</span>
              )}
            </div>
            {timeDisplay.line2 && (
              <div className="text-xs text-gray-600">
                {useRetroStyle ? (
                  <RetroDigitalText text={timeDisplay.line2} className="text-xs" />
                ) : (
                  <span className="text-xs text-gray-600">{timeDisplay.line2}</span>
                )}
              </div>
            )}
          </div>
        )}

        {isEditingTimes && (
          <div className="px-5 mb-2">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                className="w-full text-center text-xs text-gray-700 bg-transparent border-none outline-none placeholder-gray-500"
                placeholder="YYYY-MM-DD HH:MM or 3pm"
              />
              <input
                type="text"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                className="w-full text-center text-xs text-gray-700 bg-transparent border-none outline-none placeholder-gray-500"
                placeholder="End time (optional)"
              />
              <div className="flex justify-center gap-3 mt-1">
                <button className="control-button px-3 py-1" onClick={saveTimeEditor}>Save</button>
                <button className="control-button px-3 py-1" onClick={cancelTimeEditor}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PanelWrapper({ panel, onDragStart, onDrag, onDragEnd, useRetroStyleGlobal, onStateChange }) {
  const wrapperRef = useRef(null);
  const dragStateRef = useRef({ dragging: false, offsetX: 0, offsetY: 0, startX: 0, startY: 0 });

  const handleMouseDown = (e) => {
    const interactive = e.target.closest('input, button, [contenteditable="true"]');
    if (interactive) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    dragStateRef.current.dragging = true;
    dragStateRef.current.offsetX = e.clientX - rect.left;
    dragStateRef.current.offsetY = e.clientY - rect.top;
    dragStateRef.current.startX = panel.x;
    dragStateRef.current.startY = panel.y;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { once: true });
    onDragStart();
  };

  const handleMouseMove = (e) => {
    if (!dragStateRef.current.dragging) return;
    const newX = e.clientX - dragStateRef.current.offsetX;
    const newY = e.clientY - dragStateRef.current.offsetY;
    onDrag(panel.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    dragStateRef.current.dragging = false;
    window.removeEventListener('mousemove', handleMouseMove);
    onDragEnd(panel.id);
  };

  return (
    <div
      ref={wrapperRef}
      className="panel-wrapper"
      style={{ left: `${panel.x}px`, top: `${panel.y}px`, width: `${PANEL_WIDTH}px`, height: `${PANEL_HEIGHT}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="main-panel smooth-transition relative mx-auto w-full h-full">
        <EarningsPanel useRetroStyleGlobal={useRetroStyleGlobal} onStateChange={(state) => onStateChange(panel.id, state)} />
      </div>
    </div>
  );
}

// Simple debounce function to prevent rapid state changes
// Defined outside of component to avoid recreation on each render
const debounce = (func, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

export default function App() {
  const [panels, setPanels] = useState([]);
  const [scale, setScale] = useState(1);
  const stageRef = useRef(null);
  const [useRetroStyle, setUseRetroStyle] = useState(true);
  const worldRef = useRef(null);
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [plusState, setPlusState] = useState(null); // {panelId, side, x, y, neighborId?}
  const lastPlusStateRef = useRef(null); // Store last stable plus state to prevent flickering

  // DEBUG: Tracking variables for button flickering
  const [showDebugOverlay, setShowDebugOverlay] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [buttonStats, setButtonStats] = useState({
    top: { visible: false, toggleCount: 0, lastToggle: 0 },
    right: { visible: false, toggleCount: 0, lastToggle: 0 },
    bottom: { visible: false, toggleCount: 0, lastToggle: 0 },
    left: { visible: false, toggleCount: 0, lastToggle: 0 }
  });

  // Canvas management (temporary in-memory only; TODO: move to DB for persistence across reloads)
  const [canvases, setCanvases] = useState([]);
  const [activeCanvasId, setActiveCanvasId] = useState(null);
  const [showCanvasLibrary, setShowCanvasLibrary] = useState(false);

  // Inline rename state for canvases
  const [editingCanvasId, setEditingCanvasId] = useState(null);
  const [editingCanvasName, setEditingCanvasName] = useState("");
  const inputRef = useRef(null);

  // Focus input when editing
  useEffect(() => {
    if (editingCanvasId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCanvasId]);

  useEffect(() => {
    // Initialize first canvas with one centered panel
    const x = Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2);
    const y = Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2);
    const firstPanel = { id: `panel-${Date.now()}`, x, y, title: 'PayTracker', state: undefined };
    const firstCanvas = { id: `canvas-${Date.now()}`, name: 'Canvas 1', panels: [firstPanel], lastSnapshotAt: Date.now() };
    setCanvases([firstCanvas]);
    setActiveCanvasId(firstCanvas.id);
    setPanels(firstCanvas.panels);
  }, []);

  // Keep active canvas panels in sync with local in-memory canvases list
  useEffect(() => {
    if (!activeCanvasId) return;
    setCanvases((prev) => prev.map(c => c.id === activeCanvasId ? { ...c, panels: panels } : c));
  }, [panels, activeCanvasId]);

  const handleWheel = (e) => {
    const overInput = e.target.closest('input, [contenteditable="true"]');
    if (overInput) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setScale((prev) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +(prev + delta).toFixed(2))));
  };

  // Attach non-passive wheel listener so preventDefault works without warnings
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Helpers for edge math
  const rectsOverlap = (a, b) => !(a.x + PANEL_WIDTH <= b.x || b.x + PANEL_WIDTH <= a.x || a.y + PANEL_HEIGHT <= b.y || b.y + PANEL_HEIGHT <= a.y);

  const verticalOverlapAmount = (a, b) => Math.max(0, Math.min(a.y + PANEL_HEIGHT, b.y + PANEL_HEIGHT) - Math.max(a.y, b.y));
  const horizontalOverlapAmount = (a, b) => Math.max(0, Math.min(a.x + PANEL_WIDTH, b.x + PANEL_WIDTH) - Math.max(a.x, b.x));

  const isStuckHorizontal = (a, b) => {
    const rightToLeft = Math.abs((a.x + PANEL_WIDTH + PANEL_GAP) - b.x) <= STUCK_EPSILON;
    const leftToRight = Math.abs((b.x + PANEL_WIDTH + PANEL_GAP) - a.x) <= STUCK_EPSILON;
    return (rightToLeft || leftToRight) && verticalOverlapAmount(a, b) > 0;
  };

  const isStuckVertical = (a, b) => {
    const bottomToTop = Math.abs((a.y + PANEL_HEIGHT + PANEL_GAP) - b.y) <= STUCK_EPSILON;
    const topToBottom = Math.abs((b.y + PANEL_HEIGHT + PANEL_GAP) - a.y) <= STUCK_EPSILON;
    return (bottomToTop || topToBottom) && horizontalOverlapAmount(a, b) > 0;
  };

  const findNeighborOnSide = (base, side) => {
    let candidate = null;
    for (const other of panels) {
      if (other.id === base.id) continue;
      if ((side === 'right' || side === 'left') && isStuckHorizontal(base, other)) {
        const isRight = Math.abs((base.x + PANEL_WIDTH + PANEL_GAP) - other.x) <= STUCK_EPSILON;
        const isLeft = Math.abs((other.x + PANEL_WIDTH + PANEL_GAP) - base.x) <= STUCK_EPSILON;
        if ((side === 'right' && isRight) || (side === 'left' && isLeft)) { candidate = other; break; }
      }
      if ((side === 'top' || side === 'bottom') && isStuckVertical(base, other)) {
        const isBottom = Math.abs((base.y + PANEL_HEIGHT + PANEL_GAP) - other.y) <= STUCK_EPSILON;
        const isTop = Math.abs((other.y + PANEL_HEIGHT + PANEL_GAP) - base.y) <= STUCK_EPSILON;
        if ((side === 'bottom' && isBottom) || (side === 'top' && isTop)) { candidate = other; break; }
      }
    }
    return candidate;
  };

  // Stable refs for position tracking - defined at component level
  const stablePositionRef = useRef(null);
  const activeTimerRef = useRef(null);
  const lastMousePositionRef = useRef({ x: 0, y: 0 });

  // Memoize the function to find neighbor on side to avoid recreating it on every render
  const memoizedFindNeighborOnSide = useCallback((base, side) => {
    return findNeighborOnSide(base, side);
  }, [panels]); // Only depends on panels

  // Track mouse position globally for debugging
  useEffect(() => {
    const trackMousePosition = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', trackMousePosition);
    return () => window.removeEventListener('mousemove', trackMousePosition);
  }, []);

    // Track the last locked edge to prevent rapid toggling
  const edgeLockRef = useRef({
    side: null,
    panelId: null,
    lockedUntil: 0
  });
  
  // Track mouse to position a single global plus button near the closest edge
  useEffect(() => {
    // Calculate plus button position based on mouse position
    const calculatePlusPosition = (e) => {
      // Store the current mouse position
      const currentMousePos = { 
        x: e.clientX, 
        y: e.clientY 
      };
      lastMousePositionRef.current = currentMousePos;
      
      // Check if we're interacting with an interactive element
      const interactive = e.target && (e.target.closest && e.target.closest('input, [contenteditable="true"], button.global-plus'));
      if (!worldRef.current || isDraggingAny || interactive) {
        if (plusState !== null) {
          // Don't immediately hide the button - set a timer to hide it
          if (!activeTimerRef.current) {
            activeTimerRef.current = setTimeout(() => {
              // DEBUG: Track button becoming invisible
              if (plusState) {
                const side = plusState.side;
                setButtonStats(prev => ({
                  ...prev,
                  [side]: {
                    ...prev[side],
                    visible: false,
                    toggleCount: prev[side].toggleCount + 1,
                    lastToggle: Date.now()
                  }
                }));
              }
              
              setPlusState(null);
              lastPlusStateRef.current = null;
              stablePositionRef.current = null;
              activeTimerRef.current = null;
              // Don't reset edge lock here to prevent immediate reappearance
            }, 300); // Increased delay before hiding
          }
        }
        return;
      }
      
      // Clear any active hide timer since we're moving
      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current);
        activeTimerRef.current = null;
      }
      
      const rect = worldRef.current.getBoundingClientRect();
      const localX = (e.clientX - rect.left) / scale;
      const localY = (e.clientY - rect.top) / scale;

      // Check if we're still within the locked edge's panel and side
      const now = Date.now();
      const isLocked = edgeLockRef.current.lockedUntil > now;
      
      // Apply hysteresis: If we already have a plus state, use a larger radius to keep it
      const currentRadius = EDGE_TRIGGER_RADIUS + (plusState ? EDGE_HYSTERESIS * 2 : 0);

      let best = null; // {panelId, side, dist}
      let bestDist = Infinity;
      
      // First pass - check if we should maintain the current edge due to lock
      if (isLocked && plusState) {
        const lockedPanel = panels.find(p => p.id === edgeLockRef.current.panelId);
        if (lockedPanel) {
          const side = edgeLockRef.current.side;
          let dist;
          let withinBounds = false;
          
          // Calculate distance to the locked edge
          if (side === 'left') {
            dist = Math.abs(localX - lockedPanel.x);
            withinBounds = localY >= lockedPanel.y - currentRadius && 
                          localY <= lockedPanel.y + PANEL_HEIGHT + currentRadius;
          } else if (side === 'right') {
            dist = Math.abs(localX - (lockedPanel.x + PANEL_WIDTH));
            withinBounds = localY >= lockedPanel.y - currentRadius && 
                          localY <= lockedPanel.y + PANEL_HEIGHT + currentRadius;
          } else if (side === 'top') {
            dist = Math.abs(localY - lockedPanel.y);
            withinBounds = localX >= lockedPanel.x - currentRadius && 
                          localX <= lockedPanel.x + PANEL_WIDTH + currentRadius;
          } else if (side === 'bottom') {
            dist = Math.abs(localY - (lockedPanel.y + PANEL_HEIGHT));
            withinBounds = localX >= lockedPanel.x - currentRadius && 
                          localX <= lockedPanel.x + PANEL_WIDTH + currentRadius;
          }
          
          // Use a much larger radius for locked edges to prevent flickering
          const lockRadius = currentRadius * 1.5;
          
          if (dist !== undefined && dist <= lockRadius && withinBounds) {
            best = { 
              panelId: lockedPanel.id, 
              side: side, 
              dist: dist,
              locked: true
            };
            bestDist = dist;
          }
        }
      }
      
      // Only proceed to check other edges if we don't have a locked edge match
      if (!best) {
        // Second pass - find the best edge
        for (const p of panels) {
          const leftDist = Math.abs(localX - p.x);
          const rightDist = Math.abs(localX - (p.x + PANEL_WIDTH));
          const topDist = Math.abs(localY - p.y);
          const bottomDist = Math.abs(localY - (p.y + PANEL_HEIGHT));
  
          // More generous boundaries for determining if we're near a panel edge
          const withinY = localY >= p.y - currentRadius && localY <= p.y + PANEL_HEIGHT + currentRadius;
          const withinX = localX >= p.x - currentRadius && localX <= p.x + PANEL_WIDTH + currentRadius;
  
          // Only consider edges that are actually close to the mouse
          if (withinY && leftDist <= currentRadius && leftDist < bestDist) {
            best = { panelId: p.id, side: 'left', dist: leftDist };
            bestDist = leftDist;
          }
          
          if (withinY && rightDist <= currentRadius && rightDist < bestDist) {
            best = { panelId: p.id, side: 'right', dist: rightDist };
            bestDist = rightDist;
          }
          
          if (withinX && topDist <= currentRadius && topDist < bestDist) {
            best = { panelId: p.id, side: 'top', dist: topDist };
            bestDist = topDist;
          }
          
          if (withinX && bottomDist <= currentRadius && bottomDist < bestDist) {
            best = { panelId: p.id, side: 'bottom', dist: bottomDist };
            bestDist = bottomDist;
          }
        }
      }

      // If we don't have a best candidate but we had a previous position, keep it for stability
      if (!best) {
        if (plusState) {
          // Only hide if we're far from the current edge
          const currentEdge = plusState.side;
          const currentPanelId = plusState.panelId;
          const currentPanel = panels.find(p => p.id === currentPanelId);
          
          if (currentPanel) {
            let distFromCurrentEdge;
            let withinCurrentBounds = false;
            
            if (currentEdge === 'left') {
              distFromCurrentEdge = Math.abs(localX - currentPanel.x);
              withinCurrentBounds = localY >= currentPanel.y - currentRadius * 1.5 && 
                                   localY <= currentPanel.y + PANEL_HEIGHT + currentRadius * 1.5;
            } else if (currentEdge === 'right') {
              distFromCurrentEdge = Math.abs(localX - (currentPanel.x + PANEL_WIDTH));
              withinCurrentBounds = localY >= currentPanel.y - currentRadius * 1.5 && 
                                   localY <= currentPanel.y + PANEL_HEIGHT + currentRadius * 1.5;
            } else if (currentEdge === 'top') {
              distFromCurrentEdge = Math.abs(localY - currentPanel.y);
              withinCurrentBounds = localX >= currentPanel.x - currentRadius * 1.5 && 
                                   localX <= currentPanel.x + PANEL_WIDTH + currentRadius * 1.5;
            } else if (currentEdge === 'bottom') {
              distFromCurrentEdge = Math.abs(localY - (currentPanel.y + PANEL_HEIGHT));
              withinCurrentBounds = localX >= currentPanel.x - currentRadius * 1.5 && 
                                   localX <= currentPanel.x + PANEL_WIDTH + currentRadius * 1.5;
            }
            
            // If we're still reasonably close to the current edge, keep the button
            if (distFromCurrentEdge !== undefined && 
                distFromCurrentEdge <= currentRadius * 2 && 
                withinCurrentBounds) {
              return; // Keep current state
            }
          }
          
          // If we get here, we're far enough away to hide the button
          if (!activeTimerRef.current) {
            activeTimerRef.current = setTimeout(() => {
              // DEBUG: Track button becoming invisible
              if (plusState) {
                const side = plusState.side;
                setButtonStats(prev => ({
                  ...prev,
                  [side]: {
                    ...prev[side],
                    visible: false,
                    toggleCount: prev[side].toggleCount + 1,
                    lastToggle: Date.now()
                  }
                }));
              }
              
              setPlusState(null);
              lastPlusStateRef.current = null;
              stablePositionRef.current = null;
              activeTimerRef.current = null;
            }, 200);
          }
        }
        return;
      }

      // If we have a best candidate, calculate position
      if (best) {
        const base = panels.find(p => p.id === best.panelId);
        if (!base) return;
        
        const neighbor = memoizedFindNeighborOnSide(base, best.side);
        let x = base.x + PANEL_WIDTH / 2;
        let y = base.y + PANEL_HEIGHT / 2;
        const offset = 16; // desired offset from edge

        if (neighbor) {
          // Position between stuck panels
          if (best.side === 'left' || best.side === 'right') {
            const baseRight = base.x + PANEL_WIDTH;
            const neighborLeft = neighbor.x;
            x = (baseRight + neighborLeft) / 2;
            const ovTop = Math.max(base.y, neighbor.y);
            const ovBottom = Math.min(base.y + PANEL_HEIGHT, neighbor.y + PANEL_HEIGHT);
            y = (ovTop + ovBottom) / 2;
          } else {
            const baseBottom = base.y + PANEL_HEIGHT;
            const neighborTop = neighbor.y;
            y = (baseBottom + neighborTop) / 2;
            const ovLeft = Math.max(base.x, neighbor.x);
            const ovRight = Math.min(base.x + PANEL_WIDTH, neighbor.x + PANEL_WIDTH);
            x = (ovLeft + ovRight) / 2;
          }
          
          const newState = { 
            panelId: best.panelId, 
            side: best.side, 
            x, 
            y, 
            neighborId: neighbor.id,
            timestamp: Date.now() 
          };
          
          // Only update if position has changed significantly or it's a different edge
          const significantChange = stablePositionRef.current && (
            Math.abs(stablePositionRef.current.x - x) > POSITION_CHANGE_THRESHOLD || 
            Math.abs(stablePositionRef.current.y - y) > POSITION_CHANGE_THRESHOLD
          );
          
          const differentEdge = !stablePositionRef.current || 
                               best.panelId !== stablePositionRef.current.panelId || 
                               best.side !== stablePositionRef.current.side;
          
          if (significantChange || differentEdge || !plusState) {
            stablePositionRef.current = newState;
            
            // If we're changing edges, lock the new edge
            if (differentEdge) {
              edgeLockRef.current = {
                side: best.side,
                panelId: best.panelId,
                lockedUntil: Date.now() + EDGE_LOCK_TIMEOUT
              };
            }
            
            // DEBUG: Track button becoming visible or changing
            const prevSide = plusState?.side;
            const newSide = best.side;
            
            // If side changed or button was previously invisible
            if (prevSide !== newSide || !plusState) {
              // If previous side exists, mark it invisible
              if (prevSide) {
                setButtonStats(prev => ({
                  ...prev,
                  [prevSide]: {
                    ...prev[prevSide],
                    visible: false,
                    toggleCount: prev[prevSide].toggleCount + 1,
                    lastToggle: Date.now()
                  }
                }));
              }
              
              // Mark new side visible
              setButtonStats(prev => ({
                ...prev,
                [newSide]: {
                  ...prev[newSide],
                  visible: true,
                  toggleCount: prev[newSide].toggleCount + 1,
                  lastToggle: Date.now()
                }
              }));
            }
            
            setPlusState(newState);
            lastPlusStateRef.current = newState;
          }
        } else {
          // Position outside selected edge
          if (best.side === 'left') x = base.x - (offset);
          if (best.side === 'right') x = base.x + PANEL_WIDTH + (offset);
          if (best.side === 'top') y = base.y - (offset);
          if (best.side === 'bottom') y = base.y + PANEL_HEIGHT + (offset);
          if (best.side === 'left' || best.side === 'right') y = base.y + PANEL_HEIGHT / 2;
          if (best.side === 'top' || best.side === 'bottom') x = base.x + PANEL_WIDTH / 2;
          
          const newState = { 
            panelId: best.panelId, 
            side: best.side, 
            x, 
            y,
            timestamp: Date.now() 
          };
          
          // Only update if position has changed significantly or it's a different edge
          const significantChange = stablePositionRef.current && (
            Math.abs(stablePositionRef.current.x - x) > POSITION_CHANGE_THRESHOLD || 
            Math.abs(stablePositionRef.current.y - y) > POSITION_CHANGE_THRESHOLD
          );
          
          const differentEdge = !stablePositionRef.current || 
                               best.panelId !== stablePositionRef.current.panelId || 
                               best.side !== stablePositionRef.current.side;
          
          if (significantChange || differentEdge || !plusState) {
            stablePositionRef.current = newState;
            
            // If we're changing edges, lock the new edge
            if (differentEdge) {
              edgeLockRef.current = {
                side: best.side,
                panelId: best.panelId,
                lockedUntil: Date.now() + EDGE_LOCK_TIMEOUT
              };
            }
            
            // DEBUG: Track button becoming visible or changing
            const prevSide = plusState?.side;
            const newSide = best.side;
            
            // If side changed or button was previously invisible
            if (prevSide !== newSide || !plusState) {
              // If previous side exists, mark it invisible
              if (prevSide) {
                setButtonStats(prev => ({
                  ...prev,
                  [prevSide]: {
                    ...prev[prevSide],
                    visible: false,
                    toggleCount: prev[prevSide].toggleCount + 1,
                    lastToggle: Date.now()
                  }
                }));
              }
              
              // Mark new side visible
              setButtonStats(prev => ({
                ...prev,
                [newSide]: {
                  ...prev[newSide],
                  visible: true,
                  toggleCount: prev[newSide].toggleCount + 1,
                  lastToggle: Date.now()
                }
              }));
            }
            
            setPlusState(newState);
            lastPlusStateRef.current = newState;
          }
        }
      }
    };
    
    // Use throttling for smoother experience
    let lastCallTime = 0;
    
    const throttledHandleMove = (e) => {
      const now = Date.now();
      if (now - lastCallTime >= THROTTLE_DELAY) {
        lastCallTime = now;
        calculatePlusPosition(e);
      }
    };

    const el = stageRef.current;
    if (!el) return;
    el.addEventListener('mousemove', throttledHandleMove);
    
    return () => {
      el.removeEventListener('mousemove', throttledHandleMove);
      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current);
      }
    };
  }, [panels, scale, isDraggingAny, plusState, memoizedFindNeighborOnSide]);

  const handleDrag = (id, pos) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, ...pos } : p)));
  };

  const handleDragStart = () => {
    setIsDraggingAny(true);
    setPlusState(null);
  };

  const handleDragEnd = (id) => {
    setIsDraggingAny(false);
    setPanels((prev) => {
      const me = prev.find(p => p.id === id);
      if (!me) return prev;
      let snapX = me.x;
      let snapY = me.y;
      let didSnap = false;
      for (const other of prev) {
        if (other.id === id) continue;
        const vertOverlap = !(me.y + PANEL_HEIGHT < other.y || other.y + PANEL_HEIGHT < me.y);
        if (vertOverlap) {
          if (Math.abs((me.x + PANEL_WIDTH) - other.x) <= STICK_THRESHOLD) {
            snapX = other.x - PANEL_WIDTH - PANEL_GAP; didSnap = true;
          } else if (Math.abs(me.x - (other.x + PANEL_WIDTH)) <= STICK_THRESHOLD) {
            snapX = other.x + PANEL_WIDTH + PANEL_GAP; didSnap = true;
          }
        }
        const horizOverlap = !(me.x + PANEL_WIDTH < other.x || other.x + PANEL_WIDTH < me.x);
        if (horizOverlap) {
          if (Math.abs((me.y + PANEL_HEIGHT) - other.y) <= STICK_THRESHOLD) {
            snapY = other.y - PANEL_HEIGHT - PANEL_GAP; didSnap = true;
          } else if (Math.abs(me.y - (other.y + PANEL_HEIGHT)) <= STICK_THRESHOLD) {
            snapY = other.y + PANEL_HEIGHT + PANEL_GAP; didSnap = true;
          }
        }
      }
      if (!didSnap) return prev;
      return prev.map(p => p.id === id ? { ...p, x: snapX, y: snapY } : p);
    });
  };

  const createPanelAdjacent = (panelId, side) => {
    const base = panels.find(p => p.id === panelId);
    if (!base) return;
    let x = base.x;
    let y = base.y;
    if (side === 'right') x = base.x + PANEL_WIDTH + PANEL_GAP;
    if (side === 'left') x = Math.max(0, base.x - PANEL_WIDTH - PANEL_GAP);
    if (side === 'bottom') y = base.y + PANEL_HEIGHT + PANEL_GAP;
    if (side === 'top') y = Math.max(0, base.y - PANEL_HEIGHT - PANEL_GAP);
    const newPanel = { id: `panel-${Date.now()}`, x, y, title: 'PayTracker' };
    const doesOverlap = (a, b) => !(a.x + PANEL_WIDTH <= b.x || b.x + PANEL_WIDTH <= a.x || a.y + PANEL_HEIGHT <= b.y || b.y + PANEL_HEIGHT <= a.y);
    let safePanel = { ...newPanel };
    let guard = 0;
    while (panels.some(p => doesOverlap(safePanel, p)) && guard < 200) {
      guard += 1;
      if (side === 'right') safePanel.x += PANEL_GAP;
      if (side === 'left') safePanel.x = Math.max(0, safePanel.x - PANEL_GAP);
      if (side === 'bottom') safePanel.y += PANEL_GAP;
      if (side === 'top') safePanel.y = Math.max(0, safePanel.y - PANEL_GAP);
    }
    setPanels(prev => [...prev, safePanel]);
  };

  // Panel state bridge: EarningsPanel pushes its current state here so we can store in canvas
  const handlePanelStateChange = (panelId, state) => {
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, state } : p));
  };

  // Canvas operations
  const snapshotActiveCanvas = () => {
    setCanvases(prev => prev.map(c => c.id === activeCanvasId ? { ...c, panels: panels, lastSnapshotAt: Date.now() } : c));
  };

  const openCanvas = (canvasId) => {
    if (canvasId === activeCanvasId) return;
    // snapshot current
    snapshotActiveCanvas();
    // load target and adjust running panels to include elapsed since last snapshot
    const target = canvases.find(c => c.id === canvasId);
    if (!target) return;
    const now = Date.now();
    const deltaSec = Math.max(0, (now - (target.lastSnapshotAt || now)) / 1000);
    const adjustedPanels = target.panels.map(p => {
      if (!p.state) return p;
      if (p.state.isRunning) {
        return { ...p, state: { ...p.state, accumulatedSeconds: (p.state.accumulatedSeconds || 0) + deltaSec } };
      }
      return p;
    });
    setActiveCanvasId(canvasId);
    setPanels(adjustedPanels);
    setShowCanvasLibrary(false);
  };

  const createNewCanvas = () => {
    snapshotActiveCanvas();
    const x = Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2);
    const y = Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2);
    const newPanel = { id: `panel-${Date.now()}`, x, y, title: 'PayTracker', state: undefined };
    const newCanvas = { id: `canvas-${Date.now() + Math.random()}`, name: `Canvas ${canvases.length + 1}`, panels: [newPanel], lastSnapshotAt: Date.now() };
    setCanvases(prev => [...prev, newCanvas]);
    setActiveCanvasId(newCanvas.id);
    setPanels(newCanvas.panels);
    setShowCanvasLibrary(false);
  };

  const renameCanvas = (canvasId) => {
    const name = window.prompt('Rename canvas');
    if (name && name.trim()) {
      setCanvases(prev => prev.map(c => c.id === canvasId ? { ...c, name: name.trim() } : c));
    }
  };

  const deleteCanvas = (canvasId) => {
    if (!window.confirm('Delete this canvas?')) return;
    setCanvases(prev => {
      const filtered = prev.filter(c => c.id !== canvasId);
      if (filtered.length === 0) {
        // create a fresh one
        const x = Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2);
        const y = Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2);
        const fresh = { id: `canvas-${Date.now()}`, name: 'Canvas 1', panels: [{ id: `panel-${Date.now()}`, x, y, title: 'PayTracker' }], lastSnapshotAt: Date.now() };
        setActiveCanvasId(fresh.id);
        setPanels(fresh.panels);
        return [fresh];
      }
      const nextActive = filtered[0];
      setActiveCanvasId(nextActive.id);
      setPanels(nextActive.panels);
      return filtered;
    });
    setShowCanvasLibrary(false);
  };

  const insertBetweenGroups = (base, neighbor, side) => {
    const seamX = (base.x + PANEL_WIDTH + neighbor.x) / 2;
    const seamY = (base.y + PANEL_HEIGHT + neighbor.y) / 2;
    // Collect groups by BFS over stuck edges along axis
    const visited = new Set();
    const adjH = new Map();
    const adjV = new Map();
    for (const a of panels) {
      adjH.set(a.id, []);
      adjV.set(a.id, []);
    }
    for (let i = 0; i < panels.length; i++) {
      for (let j = i + 1; j < panels.length; j++) {
        const a = panels[i], b = panels[j];
        if (isStuckHorizontal(a, b)) { adjH.get(a.id).push(b.id); adjH.get(b.id).push(a.id); }
        if (isStuckVertical(a, b)) { adjV.get(a.id).push(b.id); adjV.get(b.id).push(a.id); }
      }
    }
    const useH = side === 'left' || side === 'right';
    const graph = useH ? adjH : adjV;
    const bfs = (startId) => {
      const q = [startId];
      const res = new Set([startId]);
      while (q.length) {
        const cur = q.shift();
        for (const nb of graph.get(cur) || []) {
          if (!res.has(nb)) { res.add(nb); q.push(nb); }
        }
      }
      return res;
    };
    const leftSet = bfs(base.id);
    const rightSet = bfs(neighbor.id);

    const leftArr = panels.filter(p => leftSet.has(p.id));
    const rightArr = panels.filter(p => rightSet.has(p.id));

    const leftSize = leftArr.length;
    const rightSize = rightArr.length;
    const denom = Math.max(1, leftSize + rightSize);
    const deltaLeft = (useH ? PANEL_WIDTH : PANEL_HEIGHT) * (rightSize / denom);
    const deltaRight = (useH ? PANEL_WIDTH : PANEL_HEIGHT) * (leftSize / denom);

    // Apply proposed shifts
    let next = panels.map(p => ({ ...p }));
    if (useH) {
      for (const p of next) {
        if (leftSet.has(p.id)) p.x = Math.max(0, p.x - deltaLeft);
        if (rightSet.has(p.id)) p.x = p.x + deltaRight;
      }
    } else {
      for (const p of next) {
        if (leftSet.has(p.id)) p.y = Math.max(0, p.y - deltaLeft);
        if (rightSet.has(p.id)) p.y = p.y + deltaRight;
      }
    }

    // Resolve overlaps by pushing further outward from seam
    const seamLine = useH ? ((base.x + PANEL_WIDTH + neighbor.x) / 2) : ((base.y + PANEL_HEIGHT + neighbor.y) / 2);
    let guard = 0;
    const sideOf = (p) => useH ? (p.x + PANEL_WIDTH / 2 <= seamLine ? 'left' : 'right') : (p.y + PANEL_HEIGHT / 2 <= seamLine ? 'left' : 'right');
    while (guard < 200) {
      guard += 1;
      let fixedAny = false;
      for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
          const a = next[i], b = next[j];
          if (!rectsOverlap(a, b)) continue;
          const sideA = sideOf(a); const sideB = sideOf(b);
          const move = (useH ? PANEL_GAP : PANEL_GAP);
          if (useH) {
            if (sideA === 'left' && sideB !== 'left') { a.x = Math.max(0, a.x - move); fixedAny = true; }
            else if (sideB === 'left' && sideA !== 'left') { b.x = Math.max(0, b.x - move); fixedAny = true; }
            else if (sideA === 'right') { a.x = a.x + move; fixedAny = true; }
            else if (sideB === 'right') { b.x = b.x + move; fixedAny = true; }
          } else {
            if (sideA === 'left' && sideB !== 'left') { a.y = Math.max(0, a.y - move); fixedAny = true; }
            else if (sideB === 'left' && sideA !== 'left') { b.y = Math.max(0, b.y - move); fixedAny = true; }
            else if (sideA === 'right') { a.y = a.y + move; fixedAny = true; }
            else if (sideB === 'right') { b.y = b.y + move; fixedAny = true; }
          }
        }
      }
      if (!fixedAny) break;
    }

    // Finally, place new panel at seam
    const newPanel = { id: `panel-${Date.now()}`, x: base.x, y: base.y, title: 'PayTracker' };
    if (useH) {
      newPanel.x = neighbor.x - PANEL_GAP - PANEL_WIDTH;
      newPanel.y = (Math.max(base.y, neighbor.y) + Math.min(base.y + PANEL_HEIGHT, neighbor.y + PANEL_HEIGHT)) / 2 - PANEL_HEIGHT / 2;
    } else {
      newPanel.y = neighbor.y - PANEL_GAP - PANEL_HEIGHT;
      newPanel.x = (Math.max(base.x, neighbor.x) + Math.min(base.x + PANEL_WIDTH, neighbor.x + PANEL_WIDTH)) / 2 - PANEL_WIDTH / 2;
    }

    next.push(newPanel);
    setPanels(next);
  };

  const handleAdd = (panelId, side, neighborId) => {
    const base = panels.find(p => p.id === panelId);
    if (!base) return;
    if (neighborId) {
      const neighbor = panels.find(p => p.id === neighborId);
      if (!neighbor) return;
      insertBetweenGroups(base, neighbor, side);
      return;
    }
    // default adjacent add
    setPanels((prev) => {
      const baseNow = prev.find((p) => p.id === panelId);
      if (!baseNow) return prev;
      let x = baseNow.x;
      let y = baseNow.y;
      if (side === 'right') x = baseNow.x + PANEL_WIDTH + PANEL_GAP;
      if (side === 'left') x = Math.max(0, baseNow.x - PANEL_WIDTH - PANEL_GAP);
      if (side === 'bottom') y = baseNow.y + PANEL_HEIGHT + PANEL_GAP;
      if (side === 'top') y = Math.max(0, baseNow.y - PANEL_HEIGHT - PANEL_GAP);
      const newPanel = { id: `panel-${Date.now()}`, x, y, title: 'PayTracker' };
      return [...prev, newPanel];
    });
  };

  // Toggle debug overlay
  const toggleDebugOverlay = () => {
    setShowDebugOverlay(prev => !prev);
  };

  // Reset debug stats
  const resetDebugStats = () => {
    setButtonStats({
      top: { visible: false, toggleCount: 0, lastToggle: 0 },
      right: { visible: false, toggleCount: 0, lastToggle: 0 },
      bottom: { visible: false, toggleCount: 0, lastToggle: 0 },
      left: { visible: false, toggleCount: 0, lastToggle: 0 }
    });
  };

  return (
    <div
      ref={stageRef}
      className="min-h-screen paper-background overflow-hidden relative"
    >
      {/* Debug Overlay */}
      {showDebugOverlay && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 9999,
          fontFamily: 'monospace',
          fontSize: '12px',
          width: '400px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <h3 style={{ margin: 0, fontSize: '14px' }}>Debug: + Button Flicker Tracking</h3>
            <div>
              <button
                onClick={resetDebugStats}
                style={{ marginRight: '5px', background: '#555', border: 'none', color: 'white', padding: '2px 5px', borderRadius: '3px' }}
              >
                Reset
              </button>
              <button
                onClick={toggleDebugOverlay}
                style={{ background: '#555', border: 'none', color: 'white', padding: '2px 5px', borderRadius: '3px' }}
              >
                Hide
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '5px' }}>
            <strong>Mouse:</strong> X: {mousePos.x}, Y: {mousePos.y}
          </div>

          {/* Panel edge distances */}
          <div style={{ marginBottom: '10px', fontSize: '11px' }}>
            <strong>Edge Distances:</strong>
            {panels.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '3px' }}>
                {panels.map(panel => {
                  // Calculate distances to each edge
                  const rect = worldRef.current?.getBoundingClientRect();
                  if (!rect) return null;

                  const localX = (mousePos.x - rect.left) / scale;
                  const localY = (mousePos.y - rect.top) / scale;

                  const leftDist = Math.abs(localX - panel.x);
                  const rightDist = Math.abs(localX - (panel.x + PANEL_WIDTH));
                  const topDist = Math.abs(localY - panel.y);
                  const bottomDist = Math.abs(localY - (panel.y + PANEL_HEIGHT));

                  const withinY = localY >= panel.y - EDGE_TRIGGER_RADIUS && localY <= panel.y + PANEL_HEIGHT + EDGE_TRIGGER_RADIUS;
                  const withinX = localX >= panel.x - EDGE_TRIGGER_RADIUS && localX <= panel.x + PANEL_WIDTH + EDGE_TRIGGER_RADIUS;

                  const isWithinTriggerRadius = (dist, inRange) =>
                    dist <= EDGE_TRIGGER_RADIUS && inRange;

                  return (
                    <div key={panel.id} style={{
                      padding: '3px',
                      backgroundColor: 'rgba(100, 100, 100, 0.3)',
                      borderRadius: '3px'
                    }}>
                      <div>Panel {panel.id.split('-')[1]}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '2px' }}>
                        <div style={{
                          backgroundColor: isWithinTriggerRadius(leftDist, withinY) ? 'rgba(255, 255, 0, 0.3)' : 'transparent',
                          padding: '2px'
                        }}>
                          L: {Math.round(leftDist)}
                        </div>
                        <div style={{
                          backgroundColor: isWithinTriggerRadius(rightDist, withinY) ? 'rgba(255, 255, 0, 0.3)' : 'transparent',
                          padding: '2px'
                        }}>
                          R: {Math.round(rightDist)}
                        </div>
                        <div style={{
                          backgroundColor: isWithinTriggerRadius(topDist, withinX) ? 'rgba(255, 255, 0, 0.3)' : 'transparent',
                          padding: '2px'
                        }}>
                          T: {Math.round(topDist)}
                        </div>
                        <div style={{
                          backgroundColor: isWithinTriggerRadius(bottomDist, withinX) ? 'rgba(255, 255, 0, 0.3)' : 'transparent',
                          padding: '2px'
                        }}>
                          B: {Math.round(bottomDist)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>No panels</div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            {Object.entries(buttonStats).map(([side, stats]) => (
              <div key={side} style={{
                padding: '5px',
                backgroundColor: stats.visible ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                borderRadius: '3px'
              }}>
                <div><strong>{side.charAt(0).toUpperCase() + side.slice(1)}:</strong> {stats.visible ? 'Visible' : 'Hidden'}</div>
                <div>Toggles: {stats.toggleCount}</div>
                <div>Last: {stats.lastToggle ? new Date(stats.lastToggle).toLocaleTimeString() : 'Never'}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.7 }}>
            Current Button Side: {plusState?.side || 'None'}
          </div>
        </div>
      )}

      {/* Debug Toggle Button */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        display: showDebugOverlay ? 'none' : 'block'
      }}>
        <button
          onClick={toggleDebugOverlay}
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '5px 10px'
          }}
        >
          Debug
        </button>
      </div>

      {/* New Canvas button and Library toggle */}
      <div className="style-toggle-container" style={{ left: '20px', right: 'auto' }}>
        <button className="style-toggle-button" onClick={createNewCanvas} title="Create new canvas">
          <span className="toggle-icon">➕</span>
          <span className="toggle-text">New Canvas</span>
        </button>
      </div>

      <div className="style-toggle-container" style={{ left: '20px', right: 'auto', top: '70px' }}>
        <button className="style-toggle-button" onClick={() => setShowCanvasLibrary(!showCanvasLibrary)} title="Canvas Library">
          <span className="toggle-icon">📚</span>
          <span className="toggle-text">Library</span>
        </button>
      </div>

      <div className="style-toggle-container mb-4">
        <button
          onClick={() => setUseRetroStyle(!useRetroStyle)}
          className="style-toggle-button"
          title={useRetroStyle ? "Switch to Basic Font" : "Switch to Retro Digital"}
        >
          <span className="toggle-icon">{useRetroStyle ? "🔢" : "📱"}</span>
          <span className="toggle-text">{useRetroStyle ? "Retro Digital" : "Basic Font"}</span>
        </button>
      </div>

      <div className="world" style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: `scale(${scale})` }} ref={worldRef}>
        {panels.map((p) => (
          <PanelWrapper key={p.id} panel={p} onDragStart={handleDragStart} onDrag={handleDrag} onDragEnd={handleDragEnd} useRetroStyleGlobal={useRetroStyle} onStateChange={handlePanelStateChange} />
        ))}
        {plusState && (
          <button
            className="global-plus"
            style={{ left: `${plusState.x}px`, top: `${plusState.y}px` }}
            onClick={(e) => { e.stopPropagation(); handleAdd(plusState.panelId, plusState.side, plusState.neighborId); }}
            title={`Add panel ${plusState.side}`}
          >
            +
          </button>
        )}
      </div>

      {showCanvasLibrary && (
        <div className="canvas-library" style={{ position: 'fixed', top: '120px', left: '20px', width: '260px', background: 'rgba(240,240,240,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: '12px', padding: '10px', boxShadow: '8px 8px 16px rgba(0,0,0,0.15), -8px -8px 16px rgba(255,255,255,0.6)', zIndex: 50 }}>
          <div style={{ fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Canvases (temporary - not persisted; TODO DB)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '60vh', overflowY: 'auto' }}>
            {canvases.map(c => (
              <div key={c.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '8px', background: activeCanvasId === c.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                onClick={() => openCanvas(c.id)}
              >
                {editingCanvasId === c.id ? (
                  <input
                    ref={inputRef}
                    value={editingCanvasName}
                    onChange={e => setEditingCanvasName(e.target.value)}
                    onBlur={() => {
                      if (editingCanvasName.trim()) {
                        setCanvases(prev => prev.map(cc => cc.id === c.id ? { ...cc, name: editingCanvasName.trim() } : cc));
                      }
                      setEditingCanvasId(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (editingCanvasName.trim()) {
                          setCanvases(prev => prev.map(cc => cc.id === c.id ? { ...cc, name: editingCanvasName.trim() } : cc));
                        }
                        setEditingCanvasId(null);
                      } else if (e.key === 'Escape') {
                        setEditingCanvasId(null);
                      }
                    }}
                    style={{ color: '#374151', fontSize: '12px', fontWeight: 600, width: '100%', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 4px' }}
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
                  <button className="control-button" style={{ padding: '4px 6px' }} title="Delete" onClick={e => { e.stopPropagation(); deleteCanvas(c.id); }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
