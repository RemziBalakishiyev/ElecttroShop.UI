import React from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { useTheme } from "../../core/context/ThemeContext";

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  children,
  width = "max-w-lg",
}) => {
  const { theme } = useTheme();
  
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={cn(
          "rounded-xl shadow-lg p-6 relative w-full transition-colors",
          theme === "light" ? "bg-white" : "bg-neutral-800",
          width
        )}
      >
        <button
          className={cn(
            "absolute top-3 right-3 transition-colors",
            theme === "light"
              ? "text-neutral-500 hover:text-neutral-700"
              : "text-neutral-400 hover:text-neutral-200"
          )}
          onClick={onClose}
        >
          <X size={18} />
        </button>
        {title && (
          <h2 className={cn(
            "text-lg font-semibold mb-4",
            theme === "light" ? "text-neutral-900" : "text-white"
          )}>
            {title}
          </h2>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};
