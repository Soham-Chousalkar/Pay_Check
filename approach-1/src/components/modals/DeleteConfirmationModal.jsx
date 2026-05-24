import React from 'react';

const DeleteConfirmationModal = ({ onConfirm, onCancel, dontShowAgain, setDontShowAgain }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }} onClick={onCancel}>
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '30px',
                borderRadius: '20px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                maxWidth: '400px',
                width: '90%',
                animation: 'zoomIn 0.2s ease-out'
            }} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Delete Tile?</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                    Are you sure you want to delete this tracker? <br />
                    <span className="text-sm text-red-500 font-medium">This action cannot be undone.</span>
                </p>

                <div className="flex items-center mb-8 bg-gray-50/50 p-2 rounded-lg">
                    <input
                        type="checkbox"
                        id="dontShowAgain"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500 mr-3"
                    />
                    <label htmlFor="dontShowAgain" className="text-sm text-gray-600 cursor-pointer select-none">
                        Don't ask me again
                    </label>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 text-gray-600 font-medium hover:bg-black/5 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all hover:scale-105"
                    >
                        Delete
                    </button>
                </div>
            </div>
            <style>{`
        @keyframes zoomIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
};

export default DeleteConfirmationModal;
