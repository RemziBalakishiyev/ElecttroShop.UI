import React, { createContext, useContext, useState, useCallback } from "react";
import { ToastContainer } from "../../components/commons/ToastContainer";
import type { ToastType } from "../../components/commons/Toast";

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (type: ToastType, message: string, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, message, duration }]);
    }, []);

    const success = useCallback((message: string, duration?: number) => addToast("success", message, duration), [addToast]);
    const error = useCallback((message: string, duration?: number) => addToast("error", message, duration), [addToast]);
    const info = useCallback((message: string, duration?: number) => addToast("info", message, duration), [addToast]);
    const warning = useCallback((message: string, duration?: number) => addToast("warning", message, duration), [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
