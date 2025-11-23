import React from "react";
import { cn } from "../../utils/cn";
import { useTheme } from "../../core/context/ThemeContext";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required,
  className,
  ...props
}) => {
  const { theme } = useTheme();
  
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className={cn(
          "text-sm font-medium",
          theme === "light" ? "text-neutral-700" : "text-neutral-300"
        )}>
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <input
        {...props}
        className={cn(
          "border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all",
          theme === "light"
            ? "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
            : "border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500",
          error && "border-error",
          className
        )}
      />

      {error && <p className="text-xs text-error mt-0.5">{error}</p>}
    </div>
  );
};
