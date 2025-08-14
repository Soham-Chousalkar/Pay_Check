import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo, memo } from "react";

const PANEL_WIDTH = 300;
const PANEL_HEIGHT = 200;
const PANEL_GAP = 16;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;
const EDGE_TRIGGER_RADIUS = 32;
const STICK_THRESHOLD = 16;
const PLUS_BTN_SIZE = 24;
const STUCK_EPSILON = 2; // tolerance for considering panels "stuck"

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

function EarningsPanel({ panelTitleDefault = "PayTracker", useRetroStyleGlobal = true }) {
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

        {timeDisplay && (
          <div className="text-center px-5 mb-2">
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
      </div>
    </div>
  );
}

function PanelWrapper({ panel, onDragStart, onDrag, onDragEnd, useRetroStyleGlobal }) {
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
        <EarningsPanel useRetroStyleGlobal={useRetroStyleGlobal} />
      </div>
    </div>
  );
}

export default function App() {
  const [panels, setPanels] = useState([]);
  const [scale, setScale] = useState(1);
  const stageRef = useRef(null);
  const [useRetroStyle, setUseRetroStyle] = useState(true);
  const worldRef = useRef(null);
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [plusState, setPlusState] = useState(null); // {panelId, side, x, y, neighborId?}

  useEffect(() => {
    const saved = localStorage.getItem('panelLayout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPanels(parsed);
          return;
        }
      } catch { }
    }
    const x = Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2);
    const y = Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2);
    setPanels([{ id: `panel-${Date.now()}`, x, y, title: 'PayTracker' }]);
  }, []);

  useEffect(() => {
    localStorage.setItem('panelLayout', JSON.stringify(panels));
  }, [panels]);

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

  // Track mouse to position a single global plus button near the closest edge
  useEffect(() => {
    const handleMove = (e) => {
      const interactive = e.target && (e.target.closest && e.target.closest('input, [contenteditable="true"], button'));
      if (!worldRef.current || isDraggingAny || interactive) {
        setPlusState(null);
        return;
      }
      const rect = worldRef.current.getBoundingClientRect();
      const localX = (e.clientX - rect.left) / scale;
      const localY = (e.clientY - rect.top) / scale;

      let best = null; // {panelId, side, dist}
      for (const p of panels) {
        const leftDist = Math.abs(localX - p.x);
        const rightDist = Math.abs(localX - (p.x + PANEL_WIDTH));
        const topDist = Math.abs(localY - p.y);
        const bottomDist = Math.abs(localY - (p.y + PANEL_HEIGHT));

        const withinY = localY >= p.y - EDGE_TRIGGER_RADIUS && localY <= p.y + PANEL_HEIGHT + EDGE_TRIGGER_RADIUS;
        const withinX = localX >= p.x - EDGE_TRIGGER_RADIUS && localX <= p.x + PANEL_WIDTH + EDGE_TRIGGER_RADIUS;

        const candidates = [];
        if (withinY) candidates.push({ panelId: p.id, side: 'left', dist: leftDist });
        if (withinY) candidates.push({ panelId: p.id, side: 'right', dist: rightDist });
        if (withinX) candidates.push({ panelId: p.id, side: 'top', dist: topDist });
        if (withinX) candidates.push({ panelId: p.id, side: 'bottom', dist: bottomDist });

        for (const c of candidates) {
          if (c.dist <= EDGE_TRIGGER_RADIUS) {
            if (!best || c.dist < best.dist) best = c;
          }
        }
      }

      if (!best) {
        setPlusState(null);
        return;
      }

      const base = panels.find(p => p.id === best.panelId);
      if (!base) { setPlusState(null); return; }
      const neighbor = findNeighborOnSide(base, best.side);
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
        setPlusState({ panelId: best.panelId, side: best.side, x, y, neighborId: neighbor.id });
      } else {
        // Position outside selected edge
        if (best.side === 'left') x = base.x - (offset);
        if (best.side === 'right') x = base.x + PANEL_WIDTH + (offset);
        if (best.side === 'top') y = base.y - (offset);
        if (best.side === 'bottom') y = base.y + PANEL_HEIGHT + (offset);
        if (best.side === 'left' || best.side === 'right') y = base.y + PANEL_HEIGHT / 2;
        if (best.side === 'top' || best.side === 'bottom') x = base.x + PANEL_WIDTH / 2;
        setPlusState({ panelId: best.panelId, side: best.side, x, y });
      }
    };

    const el = stageRef.current;
    if (!el) return;
    el.addEventListener('mousemove', handleMove);
    return () => el.removeEventListener('mousemove', handleMove);
  }, [panels, scale, isDraggingAny]);

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

  return (
    <div
      ref={stageRef}
      className="min-h-screen paper-background overflow-hidden relative"
    >
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
          <PanelWrapper key={p.id} panel={p} onDragStart={handleDragStart} onDrag={handleDrag} onDragEnd={handleDragEnd} useRetroStyleGlobal={useRetroStyle} />
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
    </div>
  );
}
