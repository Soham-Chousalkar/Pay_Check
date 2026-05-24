import { useState, useEffect, useRef, memo } from "react";
import { RetroDigitalNumber, RetroDigitalText } from "../RetroDigital";
import { useTime } from "../../contexts/TimeContext";
import { formatTimeOnly, formatDateOnly, formatDateTime, parseUserDateTime } from "../../utils/dateUtils";

/**
 * LoanTile - Tile for tracking Student Loan debt (Type C)
 * Features:
 * - Red text (Expense)
 * - Start/End Time configuration
 * - Historical calculation: Principal + (DailyAccrual * Days)
 */
function LoanTile({
    panelId,
    initialState,
    onStateChange,
    useRetroStyleGlobal = true,
    panelOpacity = 60
}) {
    const now = useTime();

    // State
    const [principal, setPrincipal] = useState(initialState?.principal || 0);
    const [interestRate, setInterestRate] = useState(initialState?.interestRate || 0); // Annual %
    const [startTime, setStartTime] = useState(initialState?.startTime || Date.now());
    const [endTime, setEndTime] = useState(initialState?.endTime || null);
    const [title, setTitle] = useState(initialState?.title || "Student Loan");

    // UI State
    const [isEditingConfig, setIsEditingConfig] = useState(!initialState?.principal);
    const [tempPrincipal, setTempPrincipal] = useState(initialState?.principal || "");
    const [tempRate, setTempRate] = useState(initialState?.interestRate || "");

    const [isEditingTime, setIsEditingTime] = useState(false);
    const [startInput, setStartInput] = useState("");
    const [endInput, setEndInput] = useState("");

    const onStateChangeRef = useRef(onStateChange);

    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    // Calculation Logic
    // Daily Accrual = P * (r / 365)
    // Total Interest = Daily Accrual * (Seconds Elapsed / 86400)
    // This is Simple Interest. Compound interest would be P * (1 + r/n)^(nt) but loans usually accrue daily simple.
    const dailyAccrual = principal * ((interestRate / 100) / 365);
    const accrualPerSecond = dailyAccrual / 86400;

    const effectiveEndTime = endTime || now;
    const durationSeconds = Math.max(0, (effectiveEndTime - startTime) / 1000);

    const totalInterest = durationSeconds * accrualPerSecond;
    const currentBalance = principal + totalInterest;

    // State Persist
    useEffect(() => {
        const updateState = () => {
            if (onStateChangeRef.current) {
                onStateChangeRef.current({
                    type: 'LOAN',
                    principal,
                    interestRate,
                    startTime,
                    endTime,
                    title
                });
            }
        };
        const timeoutId = setTimeout(updateState, 500);
        return () => clearTimeout(timeoutId);
    }, [principal, interestRate, startTime, endTime, title]); // No 'now' dependency


    const handleConfigSubmit = () => {
        const p = parseFloat(tempPrincipal);
        const r = parseFloat(tempRate);
        if (isFinite(p) && isFinite(r)) {
            setPrincipal(p);
            setInterestRate(r);
            setIsEditingConfig(false);
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
            if (startDate === nowDate) return `Accruing since ${formatTimeOnly(startTime)}`;
            return `Accruing since ${formatDateOnly(startTime)}`;
        }
    };

    return (
        <div className="p-5 h-full flex flex-col justify-between" style={{
            backgroundColor: `rgba(255, 255, 255, ${panelOpacity / 100})`,
            borderRadius: '20px',
            border: `2px solid rgba(100, 100, 100, ${panelOpacity / 100 * 0.3})`,
            boxShadow: `20px 20px 60px rgba(0, 0, 0, ${panelOpacity / 100 * 0.08}), -20px -20px 60px rgba(255, 255, 255, ${panelOpacity / 100 * 0.1})`
        }}>
            <div className="text-center mb-2">
                <h1
                    className="text-gray-800 font-bold text-lg px-2 cursor-pointer border-b border-transparent hover:border-gray-300 inline-block"
                    onClick={() => {
                        const newTitle = prompt("Enter Title", title);
                        if (newTitle) setTitle(newTitle);
                    }}
                >
                    {title}
                </h1>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center">
                {isEditingConfig ? (
                    <div className="flex flex-col gap-3 w-full">
                        <input
                            type="number"
                            placeholder="Principal Amount ($)"
                            value={tempPrincipal}
                            onChange={e => setTempPrincipal(e.target.value)}
                            className="p-2 border rounded bg-white/50 text-center"
                        />
                        <input
                            type="number"
                            placeholder="Interest Rate (% APY)"
                            value={tempRate}
                            onChange={e => setTempRate(e.target.value)}
                            className="p-2 border rounded bg-white/50 text-center"
                        />
                        <button
                            onClick={handleConfigSubmit}
                            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition shadow-md"
                        >
                            Start Tracking
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-4">
                            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total Debt</div>
                            {useRetroStyleGlobal ? (
                                <RetroDigitalNumber value={currentBalance.toFixed(5)} className="text-2xl text-red-600" showDollarSign={true} />
                            ) : (
                                <div className="text-2xl font-bold text-red-600 drop-shadow-sm">${currentBalance.toFixed(5)}</div>
                            )}
                        </div>

                        <div className="flex gap-4 text-xs text-gray-500 mb-4">
                            <span onClick={() => setIsEditingConfig(true)} className="cursor-pointer hover:text-red-600 border-b border-dashed border-gray-300">
                                P: ${principal}
                            </span>
                            <span onClick={() => setIsEditingConfig(true)} className="cursor-pointer hover:text-red-600 border-b border-dashed border-gray-300">
                                APR: {interestRate}%
                            </span>
                        </div>

                        {/* Time Editor */}
                        {isEditingTime ? (
                            <div className="flex flex-col gap-2 w-full px-4">
                                <input
                                    className="text-xs p-1 border rounded bg-white/50 text-center"
                                    value={startInput}
                                    onChange={e => setStartInput(e.target.value)}
                                    placeholder="Start Date"
                                />
                                <div className="flex justify-center gap-2">
                                    <button onClick={saveTimeEditor} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Save</button>
                                    <button onClick={() => setIsEditingTime(false)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600"
                                onClick={openTimeEditor}
                                title="Edit Start Date"
                            >
                                {getTimeDisplay()}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default memo(LoanTile);
