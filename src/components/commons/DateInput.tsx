import React from "react";
import { Calendar } from "lucide-react";
import { cn } from "../../utils/cn";
import { useTheme } from "../../core/context/ThemeContext";

interface DateInputProps {
  label?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  required,
  value,
  onChange,
  error,
  placeholder = "dd/mm/yyyy",
  className,
}) => {
  const { theme } = useTheme();
  
  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {label && (
        <label className={cn(
          "text-sm font-medium",
          theme === "light" ? "text-neutral-700" : "text-neutral-300"
        )}>
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full border rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all",
            theme === "light"
              ? "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
              : "border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500",
            error && "border-error"
          )}
        />
        <Calendar
          size={16}
          className={cn(
            "absolute right-3 top-3 pointer-events-none",
            theme === "light" ? "text-neutral-400" : "text-neutral-500"
          )}
        />
      </div>

      {error && <p className="text-xs text-error mt-0.5">{error}</p>}
    </div>
  );
};



