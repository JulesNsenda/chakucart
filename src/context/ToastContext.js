// src/context/ToastContext.js
import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000); // Auto-hide after 3 seconds
    };

    return (
        <ToastContext.Provider value={{ toast, showToast }}>
            {children}
            {toast && (
                <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-md shadow-lg animate-fade-in-out z-50">
                    {toast}
                    <button
                        onClick={() => setToast(null)}
                        className="ml-4 text-white hover:text-gray-200"
                    >
                        ×
                    </button>
                </div>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);