import { useEffect, useRef, useState } from "react";

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
  const [isEditingCounter, setIsEditingCounter] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [title, setTitle] = useState("PayTracker");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Refs
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const titleInputRef = useRef(null);

  // Computed values
  const dollarsPerSecond = hourlyRate ? hourlyRate / 3600 : 0;

  // Parallax mouse movement effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        setMousePosition({ x: mouseX, y: mouseY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Timer functions
  const startTimer = (rateOverride) => {
    const rate = rateOverride ?? hourlyRate;
    if (!rate || rate <= 0) return;
    if (!startTime) setStartTime(Date.now());
    if (startTimeRef.current === null) startTimeRef.current = performance.now();
    setIsRunning(true);
  };

  const pauseTimer = () => {
    if (!isRunning) return;
    if (startTimeRef.current !== null) {
      const now = performance.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      setAccumulatedSeconds((prev) => prev + elapsed);
      startTimeRef.current = null;
    }
    setIsRunning(false);
  };

  const toggleTimer = () => {
    if (isRunning) pauseTimer();
    else startTimer();
  };

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

  const handleTitleSubmit = (e) => {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  // Computed values
  const timeSinceStart = startTime
    ? (() => {
      const diff = Date.now() - startTime;
      const minutes = Math.max(0, Math.floor(diff / 60000));
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours >= 1 ? `${hours}hr ${mins}m since clock in` : `${mins}m since clock in`;
    })()
    : "";

  // Transform calculations
  const panelTransform = {
    transform: `translate3d(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px, 0) rotateX(${mousePosition.y * 0.01}deg) rotateY(${mousePosition.x * 0.01}deg)`,
  };

  const backgroundTransform = {
    transform: `translate3d(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px, 0)`,
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen paper-background parallax-container overflow-hidden relative"
      style={backgroundTransform}
    >
      {/* Main container */}
      <div className="min-h-screen flex items-center justify-center p-6">
        <div
          className="main-panel smooth-transition relative mx-auto"
          style={panelTransform}
        >
          {/* Panel content */}
          <div className="p-10 h-full flex flex-col justify-between">
            {/* Header */}
            <div className="text-center mb-8">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleTitleSubmit}
                  onBlur={handleTitleBlur}
                  className="text-gray-800 font-bold text-xl tracking-wide px-6 text-center bg-transparent border-none outline-none"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-gray-800 font-bold text-xl tracking-wide px-6 cursor-pointer hover:text-gray-600 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {title}
                </h1>
              )}
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Rate input or earnings display */}
              {!isRunning && !hourlyRate ? (
                <div className="mb-8 px-6 relative">
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
                <div className="text-center mb-8 px-6">
                  <div className="flex items-center justify-center space-x-8">
                    <div className="text-2xl text-gray-800 font-semibold earnings-display">
                      ${earnings.toFixed(5)}
                    </div>
                    <button
                      onClick={toggleTimer}
                      className="control-button p-3 rounded-full text-gray-800 hover:scale-110 transition-transform"
                      disabled={!hourlyRate}
                    >
                      {isRunning ? (
                        <div className="pause-icon"></div>
                      ) : (
                        <div className="play-icon"></div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Rate display */}
              {hourlyRate && (
                <div className="text-center mb-6 px-6">
                  <div className="text-sm text-gray-700">
                    ${hourlyRate}/hr
                  </div>
                </div>
              )}

              {/* Start time information */}
              {startTime && (
                <div className="text-center px-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-700">Start Time</span>
                    <span className="text-xs text-gray-600">{timeSinceStart}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatDateTime(startTime).replace('T', ' ')}
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
