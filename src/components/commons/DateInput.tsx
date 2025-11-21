import React from "react";
import { Calendar } from "lucide-react";
import { cn } from "../../utils/cn";

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
  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-700">
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
            "w-full border border-neutral-300 rounded-lg px-3 py-2 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400",
            "outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all",
            error && "border-error"
          )}
        />
        <Calendar
          size={16}
          className="absolute right-3 top-3 text-neutral-400 pointer-events-none"
        />
      </div>

      {error && <p className="text-xs text-error mt-0.5">{error}</p>}
    </div>
  );
};



