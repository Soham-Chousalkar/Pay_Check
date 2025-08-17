import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { RetroDigitalNumber, RetroDigitalText } from "./RetroDigital";
import { formatTimeOnly, formatDateOnly, formatDateTime, parseUserDateTime } from "../utils/dateUtils";

/**
 * EarningsPanel - The main component for tracking and displaying earnings
 */
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

  // Start timer with optional rate override
  const startTimer = useCallback((rateOverride) => {
    const rate = rateOverride ?? hourlyRate;
    if (!rate || rate <= 0) return;
    if (!startTime) setStartTime(Date.now());
    if (startTimeRef.current === null) startTimeRef.current = performance.now();
    setIsRunning(true);
    setEndTime(null);
  }, [hourlyRate, startTime]);

  // Pause the timer
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

  // Toggle timer state
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

  // Time editor actions
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

  // Focus input when editing title
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

  // Timer effect for updating earnings
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

      // Don't call onStateChange from the timer
      // This was causing the maximum update depth exceeded error
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, accumulatedSeconds, dollarsPerSecond]);

  // Update earnings when hourly rate changes
  useEffect(() => {
    if (hourlyRate != null) {
      const now = performance.now();
      const live = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
      const totalSeconds = accumulatedSeconds + live;
      setEarnings(totalSeconds * (hourlyRate / 3600));
    }

    // Debounce the state change updates to prevent maximum update depth exceeded
    const updateState = () => {
      if (onStateChange) {
        onStateChange({
          isRunning,
          hourlyRate,
          accumulatedSeconds,
          startTime,
          endTime,
          title,
        });
      }
    };

    const timeoutId = setTimeout(updateState, 0);
    return () => clearTimeout(timeoutId);
  }, [hourlyRate, accumulatedSeconds, isRunning, startTime, endTime, onStateChange, title]);

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

  // Time display helpers
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

  const timeDisplay = getTimeDisplay();

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

export default EarningsPanel;
