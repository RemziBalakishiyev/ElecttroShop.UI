import React, { useEffect, useRef, useState } from "react";
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
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevOpen = useRef(open);

  useEffect(() => {
    if (open && !prevOpen.current) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    }
    let cleanup: (() => void) | undefined;
    if (!open && prevOpen.current) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 200);
      cleanup = () => clearTimeout(t);
    }
    prevOpen.current = open;
    return cleanup;
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-200",
        visible ? "bg-black/40 backdrop-blur-sm" : "bg-black/0 backdrop-blur-none"
      )}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={cn(
          "rounded-xl shadow-xl p-6 relative w-full transition-all duration-200",
          visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95",
          theme === "light" ? "bg-white" : "bg-neutral-800",
          width
        )}
      >
        <button
          className={cn(
            "absolute top-3 right-3 p-1 rounded-lg transition-colors",
            theme === "light"
              ? "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700"
          )}
          onClick={onClose}
          aria-label="Bağla"
        >
          <X size={18} />
        </button>
        {title && (
          <h2 className={cn(
            "text-lg font-semibold mb-4 pr-6",
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
