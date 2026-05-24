import React from 'react';

const TileTypeSelector = ({ x, y, onSelect, onClose }) => {
    const options = [
        { type: 'PART_TIME', label: 'Work', icon: '💼', color: 'bg-emerald-500' },
        { type: 'SUBSCRIPTION', label: 'Sub', icon: '📅', color: 'bg-orange-500' },
        { type: 'LOAN', label: 'Loan', icon: '🎓', color: 'bg-red-500' },
    ];

    return (
        <>
            {/* Backdrop to close on click outside */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Menu */}
            <div
                className="absolute z-50 flex flex-col gap-2 p-2 bg-white rounded-lg shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200"
                style={{
                    left: x,
                    top: y,
                    transform: 'translate(10px, -50%)'
                }}
            >
                {options.map((opt) => (
                    <button
                        key={opt.type}
                        onClick={() => onSelect(opt.type)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-md transition-colors group whitespace-nowrap"
                    >
                        <div className={`w-8 h-8 rounded-full ${opt.color} text-white flex items-center justify-center shadow-sm`}>
                            {opt.icon}
                        </div>
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">
                            {opt.label}
                        </span>
                    </button>
                ))}
            </div>
        </>
    );
};

export default TileTypeSelector;
