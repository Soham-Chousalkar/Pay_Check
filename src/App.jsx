import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";

// Memoized Retro Digital Number Component
const RetroDigitalNumber = memo(({ value, className = "", showDollarSign = false }) => {
  // Memoize the digits array to prevent unnecessary re-creation
  const digits = useMemo(() => String(value).split(''), [value]);

  return (
    <div className={`retro-digital ${className}`}>
      {showDollarSign && (
        <img
          src="/Dollar-sign.png"
          alt="$"
          className="inline-block w-4 h-4 mr-1 align-middle"
          style={{
            objectFit: 'contain',
            maxWidth: '16px',
            maxHeight: '16px'
          }}
        />
      )}
      {digits.map((char, index) => {
        // Handle decimal points and other non-digit characters
        if (char === '.') {
          return (
            <span
              key={`${char}-${index}`}
              className="retro-digit"
              data-char="."
            >
              <span className="segment segment-char"></span>
              <span style={{ visibility: 'hidden' }}>{char}</span>
            </span>
          );
        }

        // Handle digits
        if (/[0-9]/.test(char)) {
          return (
            <span
              key={`${char}-${index}`}
              className="retro-digit"
              data-digit={char}
            >
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

        // Handle any other characters
        return (
          <span
            key={`${char}-${index}`}
            className="retro-digit"
            data-char={char}
          >
            <span className="segment segment-char"></span>
            <span style={{ visibility: 'hidden' }}>{char}</span>
          </span>
        );
      })}
    </div>
  );
});

RetroDigitalNumber.displayName = 'RetroDigitalNumber';

// Memoized Retro Digital Text Component
const RetroDigitalText = memo(({ text, className = "" }) => {
  // Memoize the character processing
  const characters = useMemo(() => text.split(''), [text]);

  return (
    <div className={`retro-digital ${className}`}>
      {characters.map((char, index) => {
        if (/[0-9]/.test(char)) {
          return (
            <span
              key={`${char}-${index}`}
              className="retro-digit"
              data-digit={char}
            >
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
          <span
            key={`${char}-${index}`}
            className="retro-digit"
            data-char={char}
          >
            <span className="segment segment-char"></span>
            <span style={{ visibility: 'hidden' }}>{char}</span>
          </span>
        );
      })}
    </div>
  );
});

RetroDigitalText.displayName = 'RetroDigitalText';

// Utility functions
function formatDateTime(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

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

export default function App() {
  // State management
  const [isRunning, setIsRunning] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(null);
  const [rateInput, setRateInput] = useState("");
  const [earnings, setEarnings] = useState(0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [isEditingCounter, setIsEditingCounter] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [title, setTitle] = useState("PayTracker");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [useRetroStyle, setUseRetroStyle] = useState(true);

  // Refs
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const titleInputRef = useRef(null);

  // Computed values
  const dollarsPerSecond = hourlyRate ? hourlyRate / 3600 : 0;

  // Timer functions - defined before useEffect that references them
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

  // Optimized parallax mouse movement effect with throttling
  useEffect(() => {
    let animationFrameId;
    let lastUpdate = 0;
    const throttleDelay = 16; // ~60fps

    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastUpdate < throttleDelay) return;
      lastUpdate = now;

      if (containerRef.current) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(() => {
          const rect = containerRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const mouseX = e.clientX - centerX;
          const mouseY = e.clientY - centerY;

          setMousePosition({ x: mouseX, y: mouseY });
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Keyboard event listener for spacebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if spacebar is pressed and we have an hourly rate
      if (e.code === 'Space' && hourlyRate) {
        // If we're editing the title, don't prevent default (allow normal spacebar behavior)
        if (isEditingTitle) {
          return;
        }

        // For timer control, prevent default to avoid page scrolling
        e.preventDefault();
        toggleTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hourlyRate, isEditingTitle, toggleTimer]);

  // Auto-focus title when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      // Place cursor at the end of the text
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(titleInputRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, [isEditingTitle]);

  // Timer effect
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

  // Earnings update effect
  useEffect(() => {
    if (hourlyRate != null) {
      const now = performance.now();
      const live = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
      const totalSeconds = accumulatedSeconds + live;
      setEarnings(totalSeconds * (hourlyRate / 3600));
    }
  }, [hourlyRate, accumulatedSeconds]);

  // Event handlers
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

  const handleStartTimeChange = (val) => {
    const ms = parseDateTime(val);
    if (!ms) return;
    setStartTime(ms);
    const nowMs = Date.now();
    const totalSecondsWanted = Math.max(0, (nowMs - ms) / 1000);
    setAccumulatedSeconds(totalSecondsWanted);
    if (isRunning) {
      startTimeRef.current = performance.now();
    } else {
      startTimeRef.current = null;
    }
    setEarnings(totalSecondsWanted * dollarsPerSecond);
  };

  // Memoized computed values
  const timeSinceStart = useMemo(() => {
    if (!startTime) return "";
    const diff = Date.now() - startTime;
    const minutes = Math.max(0, Math.floor(diff / 60000));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours >= 1 ? `${hours}hr ${mins}m since clock in` : `${mins}m since clock in`;
  }, [startTime]);

  // Time display logic
  const shouldShowDate = () => {
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
  };

  const getTimeDisplay = () => {
    if (!startTime) return null;

    if (shouldShowDate()) {
      if (isRunning) {
        return {
          line1: `${formatDateOnly(startTime)} ${formatTimeOnly(startTime)}`,
          line2: null
        };
      } else {
        return {
          line1: `${formatDateOnly(startTime)} ${formatTimeOnly(startTime)}`,
          line2: `${formatDateOnly(endTime)} ${formatTimeOnly(endTime)}`
        };
      }
    } else {
      if (isRunning) {
        return {
          line1: formatTimeOnly(startTime),
          line2: null
        };
      } else {
        return {
          line1: `${formatTimeOnly(startTime)} – ${formatTimeOnly(endTime)}`,
          line2: null
        };
      }
    }
  };

  // Memoized transform calculations - optimized for smoother parallax with constrained movement
  const panelTransform = useMemo(() => ({
    transform: `translate3d(${Math.max(-10, Math.min(10, mousePosition.x * 0.01))}px, ${Math.max(-10, Math.min(10, mousePosition.y * 0.01))}px, 0) rotateX(${Math.max(-5, Math.min(5, mousePosition.y * 0.005))}deg) rotateY(${Math.max(-5, Math.min(5, mousePosition.x * 0.005))}deg)`,
  }), [mousePosition.x, mousePosition.y]);

  const backgroundTransform = useMemo(() => ({
    transform: `translate3d(${Math.max(-5, Math.min(5, mousePosition.x * -0.005))}px, ${Math.max(-5, Math.min(5, mousePosition.y * -0.005))}px, 0)`,
  }), [mousePosition.x, mousePosition.y]);

  // Memoize time display to prevent unnecessary recalculations
  const timeDisplay = useMemo(() => getTimeDisplay(), [startTime, endTime, isRunning]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen paper-background parallax-container overflow-hidden relative"
      style={backgroundTransform}
    >
      {/* Main container */}
      <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden">
        {/* Style Toggle Button */}
        <div className="style-toggle-container mb-4">
          <button
            onClick={() => setUseRetroStyle(!useRetroStyle)}
            className="style-toggle-button"
            title={useRetroStyle ? "Switch to Basic Font" : "Switch to Retro Digital"}
          >
            <span className="toggle-icon">
              {useRetroStyle ? "🔢" : "📱"}
            </span>
            <span className="toggle-text">
              {useRetroStyle ? "Retro Digital" : "Basic Font"}
            </span>
          </button>
        </div>

        <div
          className="main-panel smooth-transition relative mx-auto"
          style={panelTransform}
        >
          {/* Panel content */}
          <div className="p-5 h-full flex flex-col justify-between">
            {/* Header */}
            <div className="text-center mb-4">
              <h1
                ref={titleInputRef}
                contentEditable={isEditingTitle}
                suppressContentEditableWarning
                onInput={(e) => setTitle(e.currentTarget.textContent)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setIsEditingTitle(false);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsEditingTitle(false);
                  }
                  // Allow spacebar to work normally during title editing
                }}
                onBlur={() => setIsEditingTitle(false)}
                onClick={() => !isEditingTitle && setIsEditingTitle(true)}
                className={`text-gray-800 font-bold text-xl tracking-wide px-6 transition-colors ${isEditingTitle
                  ? 'cursor-text outline-none'
                  : 'cursor-pointer hover:text-gray-600'
                  }`}
                style={{ outline: isEditingTitle ? 'none' : undefined }}
              >
                {title}
              </h1>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Rate input or earnings display */}
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
                  {/* Earnings display - centered */}
                  <div className="text-center mb-3">
                    {useRetroStyle ? (
                      <RetroDigitalNumber
                        value={earnings.toFixed(5)}
                        className="text-2xl"
                        showDollarSign={true}
                      />
                    ) : (
                      <div className="text-2xl font-bold text-gray-800">
                        ${earnings.toFixed(5)}
                      </div>
                    )}
                  </div>

                  {/* Play/Pause button - absolutely positioned */}
                  <button
                    onClick={toggleTimer}
                    className="control-button p-4 rounded-full text-gray-800 hover:scale-110 transition-transform absolute"
                    style={{
                      right: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                    disabled={!hourlyRate}
                  >
                    {isRunning ? (
                      <div className="pause-icon"></div>
                    ) : (
                      <div className="play-icon"></div>
                    )}
                  </button>
                </div>
              )}

              {/* Rate display */}
              {hourlyRate && (
                <div className="text-center mb-4 px-5">
                  <div className="text-xs text-gray-700">
                    {useRetroStyle ? (
                      <>
                        <RetroDigitalNumber
                          value={hourlyRate}
                          className="text-xs"
                          showDollarSign={true}
                        />
                        <RetroDigitalText text="/hr" className="text-xs ml-1" />
                      </>
                    ) : (
                      <span className="text-xs text-gray-700">
                        ${hourlyRate}/hr
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Time information */}
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

              {/* Time since clock in */}
              {timeSinceStart && (
                <div className="text-center px-5 mb-2">
                  <div className="text-xs text-gray-600">
                    {timeSinceStart}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
