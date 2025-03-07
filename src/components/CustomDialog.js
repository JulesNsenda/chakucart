import React from 'react';

const CustomDialog = ({ isOpen, onConfirm, onCancel, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-md p-3 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">Confirm Action</h2>
                <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-6">{message}</p>
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                    <button
                        onClick={onCancel}
                        className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200 text-sm sm:text-base"
                        aria-label="Cancel"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-sm sm:text-base"
                        aria-label="Confirm"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomDialog;