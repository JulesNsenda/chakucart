import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });

        setTimeout(() => setToast(null), 3000); // Auto-hide after 3 seconds
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
                return 'bg-blue-500';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div
                    className={`fixed top-4 left-1/2 transform -translate-x-1/2 text-white p-4 rounded-md shadow-lg animate-fade-in-out z-50 ${getToastStyle(
                        toast.type
                    )}`}
                >
                    {toast.message}
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
