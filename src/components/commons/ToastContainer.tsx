import React from "react";
import { Toast } from "./Toast";
import type { ToastProps } from "./Toast";

interface ToastContainerProps {
    toasts: Omit<ToastProps, "onClose">[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
    toasts,
    onClose,
}) => {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast {...toast} onClose={onClose} />
                </div>
            ))}
        </div>
    );
};
