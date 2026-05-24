import { useState, useEffect, useRef, memo } from "react";
import { RetroDigitalNumber, RetroDigitalText } from "../RetroDigital";
import { useTime } from "../../contexts/TimeContext";
import { formatTimeOnly, formatDateOnly, formatDateTime, parseUserDateTime } from "../../utils/dateUtils";

/**
 * SubscriptionTile - Tile for tracking monthly subscriptions (Type B)
 * Features:
 * - Red text (Expense)
 * - Start/End Time configuration
 * - Historical calculation: (Cost/Sec) * (EffectiveDuration)
 */
function SubscriptionTile({
    panelId,
    initialState,
    onStateChange,
    useRetroStyleGlobal = true,
    panelOpacity = 60
}) {
    // Global Ticker
    const now = useTime();

    // State
    const [monthlyCost, setMonthlyCost] = useState(initialState?.monthlyCost || 0);
    const [startTime, setStartTime] = useState(initialState?.startTime || Date.now()); // Default to creation time
    const [endTime, setEndTime] = useState(initialState?.endTime || null); // Null means "ongoing"
    const [title, setTitle] = useState(initialState?.title || "Subscription");

    // UI State
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingCost, setIsEditingCost] = useState(!initialState?.monthlyCost);
    const [isEditingTime, setIsEditingTime] = useState(false);

    const [costInput, setCostInput] = useState(initialState?.monthlyCost || "");
    const [startInput, setStartInput] = useState("");
    const [endInput, setEndInput] = useState("");

    const onStateChangeRef = useRef(onStateChange);
    const titleInputRef = useRef(null);

    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    // Derived Values
    const costPerSecond = monthlyCost / (30 * 24 * 3600); // Approximation: 30 days
    const effectiveEndTime = endTime || now;
    // If start is in future, duration is 0. If end is before start, duration is 0.
    const durationSeconds = Math.max(0, (effectiveEndTime - startTime) / 1000);
    const totalCost = durationSeconds * costPerSecond;

    // Persist State
    useEffect(() => {
        const updateState = () => {
            if (onStateChangeRef.current) {
                onStateChangeRef.current({
                    type: 'SUBSCRIPTION',
                    monthlyCost,
                    startTime,
                    endTime,
                    title
                });
            }
        };

        const timeoutId = setTimeout(updateState, 500);
        return () => clearTimeout(timeoutId);
    }, [monthlyCost, startTime, endTime, title]); // No 'now' dependency to avoid spamming saves

    // Handlers
    const handleCostSubmit = (e) => {
        if (e.key === "Enter") {
            const val = parseFloat(costInput);
            if (isFinite(val) && val > 0) {
                setMonthlyCost(val);
                setIsEditingCost(false);
            }
        }
    };

    const openTimeEditor = () => {
        setIsEditingTime(true);
        setStartInput(formatDateTime(startTime));
        setEndInput(endTime ? formatDateTime(endTime) : "");
    };

    const saveTimeEditor = () => {
        const newStart = parseUserDateTime(startInput, startTime);
        let newEnd = endInput ? parseUserDateTime(endInput, endTime || startTime) : null;

        if (newStart) {
            setStartTime(newStart);
            if (newEnd && newEnd < newStart) newEnd = null; // Invalid end, reset or ignore? Let's just reset to null logic or keep it simple.
            setEndTime(newEnd);
        }
        setIsEditingTime(false);
    };

    // Time Display String
    const getTimeDisplay = () => {
        if (!startTime) return "";
        const startDate = formatDateOnly(startTime);
        const nowDate = formatDateOnly(now);

        if (endTime) {
            const endDate = formatDateOnly(endTime);
            if (startDate === endDate) return `${formatDateOnly(startTime)} ${formatTimeOnly(startTime)} - ${formatTimeOnly(endTime)}`;
            return `${formatDateOnly(startTime)} - ${formatDateOnly(endTime)}`;
        } else {
            if (startDate === nowDate) return `Since ${formatTimeOnly(startTime)}`;
            return `Since ${formatDateOnly(startTime)}`;
        }
    };

    return (
        <div className="p-5 h-full flex flex-col justify-between" style={{
            backgroundColor: `rgba(255, 255, 255, ${panelOpacity / 100})`,
            borderRadius: '20px',
            border: `2px solid rgba(100, 100, 100, ${panelOpacity / 100 * 0.3})`,
            boxShadow: `20px 20px 60px rgba(0, 0, 0, ${panelOpacity / 100 * 0.08}), -20px -20px 60px rgba(255, 255, 255, ${panelOpacity / 100 * 0.1})`
        }}>
            {/* Title */}
            <div className="text-center mb-2">
                <h1
                    ref={titleInputRef}
                    contentEditable={isEditingTitle}
                    suppressContentEditableWarning
                    onInput={(e) => setTitle(e.currentTarget.textContent)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); setIsEditingTitle(false); }
                    }}
                    onClick={() => setIsEditingTitle(true)}
                    className={`text-gray-800 font-bold text-xl tracking-wide px-6 ${isEditingTitle ? 'outline-none' : 'cursor-text'}`}
                >
                    {title}
                </h1>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center items-center">
                {isEditingCost ? (
                    <div className="mb-4 w-full">
                        <input
                            type="number"
                            placeholder="Monthly Cost ($)"
                            value={costInput}
                            onChange={(e) => setCostInput(e.target.value)}
                            onKeyDown={handleCostSubmit}
                            className="w-full text-center text-lg bg-transparent border-b border-gray-300 outline-none pb-2 text-red-600 font-bold"
                            autoFocus
                        />
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-4">
                            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total Cost</div>
                            {useRetroStyleGlobal ? (
                                <RetroDigitalNumber value={totalCost.toFixed(5)} className="text-3xl text-red-600" showDollarSign={true} />
                            ) : (
                                <div className="text-3xl font-bold text-red-600 drop-shadow-sm">${totalCost.toFixed(5)}</div>
                            )}
                        </div>

                        <div
                            className="text-xs text-red-600 font-medium cursor-pointer hover:bg-red-50 px-3 py-1 rounded-full transition-colors mb-2"
                            onClick={() => setIsEditingCost(true)}
                        >
                            -${monthlyCost}/mo
                        </div>
                    </>
                )}

                {/* Time Editor / Display */}
                {isEditingTime ? (
                    <div className="flex flex-col gap-2 w-full px-4">
                        <input
                            className="text-xs p-1 border rounded bg-white/50 text-center"
                            value={startInput}
                            onChange={e => setStartInput(e.target.value)}
                            placeholder="Start Time"
                        />
                        <input
                            className="text-xs p-1 border rounded bg-white/50 text-center"
                            value={endInput}
                            onChange={e => setEndInput(e.target.value)}
                            placeholder="End Time (Optional)"
                        />
                        <div className="flex justify-center gap-2">
                            <button onClick={saveTimeEditor} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Save</button>
                            <button onClick={() => setIsEditingTime(false)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600 mt-2"
                        onClick={openTimeEditor}
                        title="Click to edit duration"
                    >
                        {getTimeDisplay()}
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(SubscriptionTile);
