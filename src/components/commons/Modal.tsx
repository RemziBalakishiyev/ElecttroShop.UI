import React from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={cn(
          "bg-white rounded-xl shadow-lg p-6 relative w-full",
          width
        )}
      >
        <button
          className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-700 transition-colors"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        {title && (
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            {title}
          </h2>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};
