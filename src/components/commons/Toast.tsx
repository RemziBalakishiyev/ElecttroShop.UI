import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn";
import { useTheme } from "../../core/context/ThemeContext";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const lightStyles = {
    success: "bg-white border-green-500",
    error: "bg-white border-red-500",
    info: "bg-white border-blue-500",
    warning: "bg-white border-yellow-500",
};

const darkStyles = {
    success: "bg-neutral-800 border-green-500",
    error: "bg-neutral-800 border-red-500",
    info: "bg-neutral-800 border-blue-500",
    warning: "bg-neutral-800 border-yellow-500",
};

const iconStyles = {
    success: "text-green-500",
    error: "text-red-500",
    info: "text-blue-500",
    warning: "text-yellow-500",
};

export const Toast: React.FC<ToastProps> = ({
    id,
    type,
    message,
    duration = 3000,
    onClose,
}) => {
    const { theme } = useTheme();
    const Icon = icons[type];
    const [exiting, setExiting] = useState(false);

    const handleClose = () => {
        setExiting(true);
        setTimeout(() => onClose(id), 180);
    };

    useEffect(() => {
        const timer = setTimeout(handleClose, duration);
        return () => clearTimeout(timer);
    }, [duration, id]);

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 min-w-[300px] max-w-md",
                exiting ? "toast-slide-out" : "toast-slide-in",
                theme === "light" ? lightStyles[type] : darkStyles[type]
            )}
            role="alert"
        >
            <Icon className={cn("w-5 h-5 flex-shrink-0", iconStyles[type])} />
            <p className={cn(
                "text-sm font-medium flex-1",
                theme === "light" ? "text-neutral-800" : "text-neutral-100"
            )}>{message}</p>
            <button
                onClick={handleClose}
                className={cn(
                    "p-1 rounded-full transition-colors",
                    theme === "light" ? "hover:bg-black/5" : "hover:bg-white/10"
                )}
                aria-label="Bağla"
            >
                <X size={16} className={theme === "light" ? "text-neutral-500" : "text-neutral-400"} />
            </button>
        </div>
    );
};
