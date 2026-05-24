import { useState, useEffect, useRef, useCallback, memo } from "react";
import { RetroDigitalNumber } from "../RetroDigital";
import { useTime } from "../../contexts/TimeContext";

/**
 * PartTimeTile - Tile for tracking hourly earnings (Type A)
 * Features:
 * - Green text (Income)
 * - Timer (Play/Pause) functionality
 * - Hourly Rate logic
 * - Uses global TimeContext
 */
function PartTimeTile({
  panelId,
  initialState,
  onStateChange,
  useRetroStyleGlobal = true,
  panelOpacity = 60
}) {
  // Global Ticker
  const now = useTime();

  // Initialize state
  const [isRunning, setIsRunning] = useState(initialState?.isRunning || false);
  const [hourlyRate, setHourlyRate] = useState(initialState?.hourlyRate || null);
  const [earnings, setEarnings] = useState(initialState?.earnings || 0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(initialState?.accumulatedSeconds || 0);
  const [startTime, setStartTime] = useState(initialState?.startTime || null);
  const [endTime, setEndTime] = useState(initialState?.endTime || null);
  const [title, setTitle] = useState(initialState?.title || "Part-Time Job");

  // UI State
  const [rateInput, setRateInput] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const titleInputRef = useRef(null);
  const startTimeRef = useRef(null);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

  // Restore timer ref on mount if running
  useEffect(() => {
    if (initialState?.isRunning && startTimeRef.current === null) {
      startTimeRef.current = Date.now(); // Use Date.now() to match useTime
    }
  }, []);

  const dollarsPerSecond = hourlyRate ? hourlyRate / 3600 : 0;

  // Timer: Start
  const startTimer = useCallback((rateOverride) => {
    const rate = rateOverride ?? hourlyRate;
    if (!rate || rate <= 0) return;

    // Set official start time if not set
    if (!startTime) setStartTime(Date.now());

    // Set internal ref for calc
    if (startTimeRef.current === null) startTimeRef.current = Date.now();

    setIsRunning(true);
    setEndTime(null);
  }, [hourlyRate, startTime]);

  // Timer: Pause
  const pauseTimer = useCallback(() => {
    if (!isRunning) return;
    if (startTimeRef.current !== null) {
      const currentNow = Date.now();
      const elapsed = (currentNow - startTimeRef.current) / 1000;
      setAccumulatedSeconds((prev) => prev + elapsed);
      startTimeRef.current = null;
    }
    setIsRunning(false);
    setEndTime(Date.now());
  }, [isRunning]);

  // Toggle
  const toggleTimer = useCallback(() => {
    if (isRunning) pauseTimer();
    else startTimer();
  }, [isRunning, pauseTimer, startTimer]);

  // Recalculate Earnings on every 'now' tick (from context)
  useEffect(() => {
    if (isRunning && hourlyRate) {
      const live = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
      const totalSeconds = accumulatedSeconds + live;
      setEarnings(totalSeconds * (hourlyRate / 3600));
    } else if (!isRunning && hourlyRate) {
      // Even if not running, ensure math is consistent
      setEarnings(accumulatedSeconds * (hourlyRate / 3600));
    }
  }, [now, isRunning, accumulatedSeconds, hourlyRate]); // 'now' drives the update

  // Persistence
  useEffect(() => {
    const updateState = () => {
      if (onStateChangeRef.current) {
        onStateChangeRef.current({
          type: 'PART_TIME',
          isRunning,
          hourlyRate,
          accumulatedSeconds,
          startTime,
          endTime,
          title,
          earnings,
        });
      }
    };
    const timeoutId = setTimeout(updateState, 500);
    return () => clearTimeout(timeoutId);
  }, [isRunning, hourlyRate, accumulatedSeconds, startTime, endTime, title, earnings]);


  // Handlers
  const handleRateSubmit = (e) => {
    if (e.key === "Enter") {
      const parsed = parseFloat(rateInput);
      if (isFinite(parsed) && parsed > 0) {
        setHourlyRate(parsed);
        setEarnings(0);
        setAccumulatedSeconds(0);
        setStartTime(Date.now());
        setEndTime(null);
        startTimeRef.current = null;
        startTimer(parsed);
      }
    }
  };

  return (
    <div className="p-5 h-full flex flex-col justify-between" style={{
      backgroundColor: `rgba(255, 255, 255, ${panelOpacity / 100})`,
      borderRadius: '20px',
      border: `2px solid rgba(100, 100, 100, ${panelOpacity / 100 * 0.3})`,
      boxShadow: `20px 20px 60px rgba(0, 0, 0, ${panelOpacity / 100 * 0.08}), -20px -20px 60px rgba(255, 255, 255, ${panelOpacity / 100 * 0.1})`
    }}>
      <div className="text-center mb-4">
        <h1
          ref={titleInputRef}
          contentEditable={isEditingTitle}
          suppressContentEditableWarning
          onInput={(e) => setTitle(e.currentTarget.textContent)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setIsEditingTitle(false); } }}
          onBlur={() => setIsEditingTitle(false)}
          onClick={() => !isEditingTitle && setIsEditingTitle(true)}
          className={`text-gray-800 font-bold text-xl tracking-wide px-6 transition-colors ${isEditingTitle ? 'outline-none' : 'cursor-text hover:text-gray-600'}`}
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
              className="w-full text-center text-lg text-emerald-600 font-bold bg-transparent border-none outline-none placeholder-gray-500 cursor-text"
            />
          </div>
        ) : (
          <div className="text-center mb-8 px-5 relative">
            <div className="text-center mb-3">
              {useRetroStyleGlobal ? (
                <RetroDigitalNumber value={earnings.toFixed(5)} className="text-2xl text-emerald-600" showDollarSign={true} />
              ) : (
                <div className="text-2xl font-bold text-emerald-600">${earnings.toFixed(5)}</div>
              )}
            </div>
            <button
              onClick={toggleTimer}
              className="control-button p-4 rounded-full text-gray-800 hover:scale-110 transition-transform absolute bg-emerald-50 shadow-emerald-200"
              style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}
            >
              {isRunning ? (<div className="pause-icon bg-emerald-800"></div>) : (<div className="play-icon border-l-emerald-800"></div>)}
            </button>
          </div>
        )}

        {hourlyRate && (
          <div className="text-center mb-4 px-5">
            <div
              className="text-xs text-emerald-700 cursor-pointer hover:text-emerald-900 transition-colors font-medium"
              onClick={() => {
                const newRate = prompt("Edit Hourly Rate", hourlyRate);
                if (newRate && !isNaN(parseFloat(newRate))) setHourlyRate(parseFloat(newRate));
              }}
            >
              ${hourlyRate}/hr
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(PartTimeTile);
