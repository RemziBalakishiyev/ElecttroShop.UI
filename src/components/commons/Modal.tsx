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
  /** Pinned action area rendered below the scrollable body (kept visible while body scrolls). */
  footer?: React.ReactNode;
  /** On mobile (<640px) render the modal as a full-screen sheet. */
  mobileFullScreen?: boolean;
  /** Extra classes for the scrollable body region. */
  bodyClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  children,
  width = "max-w-lg",
  footer,
  mobileFullScreen = false,
  bodyClassName,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
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

  // Lock body scroll while mounted; restore the previous value on unmount so
  // stacked modals don't clobber each other's state.
  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [mounted]);

  if (!mounted) return null;

  const closeButton = (
    <button
      className={cn(
        "absolute top-3 right-3 p-1 rounded-lg transition-colors z-10",
        isLight
          ? "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700"
      )}
      onClick={onClose}
      aria-label="Bağla"
    >
      <X size={18} />
    </button>
  );

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto transition-all duration-200",
        mobileFullScreen && "max-sm:p-0",
        visible ? "bg-black/40 backdrop-blur-sm" : "bg-black/0 backdrop-blur-none"
      )}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={cn(
          "rounded-xl shadow-xl relative w-full my-4 flex flex-col overflow-hidden max-h-[calc(100dvh-2rem)] transition-all duration-200",
          visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95",
          isLight ? "bg-white" : "bg-neutral-800",
          mobileFullScreen && "max-sm:my-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none",
          width
        )}
      >
        {closeButton}

        {footer !== undefined ? (
          <>
            {title && (
              <h2 className={cn(
                "shrink-0 text-lg font-semibold px-6 pt-6 pb-4 pr-12",
                isLight ? "text-neutral-900" : "text-white"
              )}>
                {title}
              </h2>
            )}
            <div className={cn(
              "flex-1 overflow-y-auto custom-scrollbar px-6 py-4",
              !title && "pt-12",
              bodyClassName
            )}>
              {children}
            </div>
            <div className={cn(
              "shrink-0 px-6 py-4 border-t",
              isLight ? "border-neutral-200 bg-neutral-50/80" : "border-neutral-700 bg-neutral-900/40"
            )}>
              {footer}
            </div>
          </>
        ) : (
          <div className={cn("flex-1 overflow-y-auto custom-scrollbar p-6", bodyClassName)}>
            {title && (
              <h2 className={cn(
                "text-lg font-semibold mb-4 pr-6",
                isLight ? "text-neutral-900" : "text-white"
              )}>
                {title}
              </h2>
            )}
            <div>{children}</div>
          </div>
        )}
      </div>
    </div>
  );
};
