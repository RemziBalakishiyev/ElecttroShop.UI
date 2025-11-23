import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";

interface ConfirmationModalProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    open,
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant = "danger",
    onConfirm,
    onCancel,
    isLoading = false,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    // Default values using translation if not provided
    const finalConfirmLabel = confirmLabel || t('common.confirm');
    const finalCancelLabel = cancelLabel || t('common.cancel');

    if (!open) return null;

    const variantStyles = {
        danger: theme === "light" ? "bg-red-100 text-red-600" : "bg-red-900/30 text-red-400",
        warning: theme === "light" ? "bg-yellow-100 text-yellow-600" : "bg-yellow-900/30 text-yellow-400",
        info: theme === "light" ? "bg-blue-100 text-blue-600" : "bg-blue-900/30 text-blue-400",
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className={cn(
              "rounded-xl shadow-2xl p-6 relative w-full max-w-md animate-in zoom-in-95 duration-200",
              theme === "light" ? "bg-white" : "bg-neutral-800"
            )}>
                <button
                    onClick={onCancel}
                    className={cn(
                      "absolute top-4 right-4 transition-colors",
                      theme === "light"
                        ? "text-neutral-400 hover:text-neutral-600"
                        : "text-neutral-500 hover:text-neutral-300"
                    )}
                    disabled={isLoading}
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-4",
                      variantStyles[variant]
                    )}>
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className={cn(
                      "text-xl font-bold mb-2",
                      theme === "light" ? "text-neutral-900" : "text-white"
                    )}>{title}</h3>
                    <p className={cn(
                      "mb-8",
                      theme === "light" ? "text-neutral-600" : "text-neutral-400"
                    )}>{message}</p>

                    <div className="flex gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1 justify-center"
                            disabled={isLoading}
                        >
                            {finalCancelLabel}
                        </Button>
                        <Button
                            variant={variant === "danger" ? "danger" : "primary"}
                            onClick={onConfirm}
                            className="flex-1 justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? t('common.processing') : finalConfirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
