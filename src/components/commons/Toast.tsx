import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn";

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

const styles = {
    success: "bg-white border-green-500 text-green-700",
    error: "bg-white border-red-500 text-red-700",
    info: "bg-white border-blue-500 text-blue-700",
    warning: "bg-white border-yellow-500 text-yellow-700",
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
    const Icon = icons[type];

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, id, onClose]);

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 min-w-[300px] max-w-md toast-slide-in",
                styles[type]
            )}
            role="alert"
        >
            <Icon className={cn("w-5 h-5 flex-shrink-0", iconStyles[type])} />
            <p className="text-sm font-medium flex-1">{message}</p>
            <button
                onClick={() => onClose(id)}
                className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
                <X size={16} className="opacity-60" />
            </button>
        </div>
    );
};
