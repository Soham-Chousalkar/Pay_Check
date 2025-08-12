import { useEffect, useRef, useState } from "react";

function toLocalInputValue(ms) {
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

function fromLocalInputValue(val) {
  const ms = Date.parse(val.replace(" ", "T"));
  return isNaN(ms) ? null : ms;
}

export default function App() {
  const [running, setRunning] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [earnings, setEarnings] = useState(0);
  const [accumulatedSec, setAccumulatedSec] = useState(0);
  const [startTimeMs, setStartTimeMs] = useState(null);
  const [counterEdit, setCounterEdit] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [title, setTitle] = useState("PayTracker");
  const [titleEditing, setTitleEditing] = useState(false);

  const startTsRef = useRef(null);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const titleInputRef = useRef(null);

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

  const start = (rateOverride) => {
    const rate = rateOverride ?? hourlyRate;
    if (!rate || rate <= 0) return;
    if (!startTimeMs) setStartTimeMs(Date.now());
    if (startTsRef.current === null) startTsRef.current = performance.now();
    setRunning(true);
  };

  const pause = () => {
    if (!running) return;
    if (startTsRef.current !== null) {
      const now = performance.now();
      const elapsed = (now - startTsRef.current) / 1000;
      setAccumulatedSec((prev) => prev + elapsed);
      startTsRef.current = null;
    }
    setRunning(false);
  };

  const toggleStartPause = () => {
    if (running) pause();
    else start();
  };

  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      const now = performance.now();
      const live = startTsRef.current ? (now - startTsRef.current) / 1000 : 0;
      const totalSec = accumulatedSec + live;
      setEarnings(totalSec * dollarsPerSecond);
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running, accumulatedSec, dollarsPerSecond]);

  useEffect(() => {
    if (hourlyRate != null) {
      const now = performance.now();
      const live = startTsRef.current ? (now - startTsRef.current) / 1000 : 0;
      const totalSec = accumulatedSec + live;
      setEarnings(totalSec * (hourlyRate / 3600));
    }
  }, [hourlyRate]); // eslint-disable-line

  const onRateKeyDown = (e) => {
    if (e.key === "Enter") {
      const parsed = parseFloat(inputValue);
      if (!isFinite(parsed) || parsed <= 0) return;
      setHourlyRate(parsed);
      setEarnings(0);
      setAccumulatedSec(0);
      setStartTimeMs(Date.now());
      startTsRef.current = null;
      start(parsed);
    }
  };

  const onCounterKeyDown = (e) => {
    if (e.key === "Enter") {
      const now = Date.now();
      setStartTimeMs(now);
      setEarnings(0);
      setAccumulatedSec(0);
      if (running) {
        startTsRef.current = performance.now();
      } else {
        startTsRef.current = null;
      }
      setCounterEdit(false);
    } else if (e.key === "Escape") {
      setCounterEdit(false);
    }
  };

  const onStartTimeChange = (val) => {
    const ms = fromLocalInputValue(val);
    if (!ms) return;
    setStartTimeMs(ms);
    const nowMs = Date.now();
    const totalSecWanted = Math.max(0, (nowMs - ms) / 1000);
    setAccumulatedSec(totalSecWanted);
    if (running) {
      startTsRef.current = performance.now();
    } else {
      startTsRef.current = null;
    }
    setEarnings(totalSecWanted * dollarsPerSecond);
  };

  const sinceText = startTimeMs
    ? (() => {
      const diff = Date.now() - startTimeMs;
      const minutes = Math.max(0, Math.floor(diff / 60000));
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours >= 1 ? `${hours}hr ${mins}m since clock in` : `${mins}m since clock in`;
    })()
    : "";

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      setTitleEditing(false);
    } else if (e.key === "Escape") {
      setTitleEditing(false);
    }
  };

  const handleTitleBlur = () => {
    setTitleEditing(false);
  };

  // Calculate parallax transforms
  const panelTransform = {
    transform: `translate3d(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px, 0) rotateX(${mousePosition.y * 0.01}deg) rotateY(${mousePosition.x * 0.01}deg)`,
  };

  const backgroundTransform = {
    transform: `translate3d(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px, 0)`,
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen paper-texture parallax-container overflow-hidden relative"
      style={backgroundTransform}
    >
      {/* Main neumorphic panel */}
      <div className="min-h-screen flex items-center justify-center p-6">
        <div
          className="neumorphic-panel smooth-transition relative mx-auto"
          style={panelTransform}
        >
          {/* Panel content */}
          <div className="p-10 h-full flex flex-col justify-between">
            {/* Header */}
            <div className="text-center mb-8">
              {titleEditing ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={handleTitleBlur}
                  className="text-gray-800 font-bold text-xl tracking-wide px-6 text-center bg-transparent border-none outline-none"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-gray-800 font-bold text-xl tracking-wide px-6 cursor-pointer hover:text-gray-600 transition-colors"
                  onClick={() => setTitleEditing(true)}
                >
                  {title}
                </h1>
              )}
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Earnings display */}
              {hourlyRate && (
                <div className="text-center mb-8 px-6">
                  <div className="text-2xl text-gray-800 font-semibold">
                    ${earnings.toFixed(5)}
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

              {/* Start Time section - text only */}
              {startTimeMs && (
                <div className="text-center px-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-700">Start Time</span>
                    <span className="text-xs text-gray-600">{sinceText}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {toLocalInputValue(startTimeMs).replace('T', ' ')}
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
