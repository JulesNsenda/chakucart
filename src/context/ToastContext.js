import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info', options = {}) => {
        setToast({ message, type, ...options });

        setTimeout(() => setToast(null), options.duration || 3000);
    };

    const getToastStyle = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-500';
            case 'error':
                return 'bg-red-500';
            case 'warning':
                return 'bg-yellow-500';
            case 'info':
            default:
                return 'bg-green-600'; 
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div
                    className={`fixed top-4 sm:top-6 left-1/2 transform -translate-x-1/2 w-full sm:w-auto max-w-xs sm:max-w-sm p-2 sm:p-3 rounded-md shadow-lg animate-fade-in-out z-50 ${getToastStyle(
                        toast.type
                    )} flex items-center justify-between`}
                >
                    <span className="text-sm sm:text-base text-white break-words">
                        {toast.message}
                    </span>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-2 sm:ml-3 text-white hover:text-gray-200 text-lg sm:text-xl focus:outline-none"
                        aria-label="Close toast"
                    >
                        ×
                    </button>
                </div>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);