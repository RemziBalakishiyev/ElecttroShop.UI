import React from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string }[];
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  required,
  placeholder = "Select",
  className,
  ...props
}) => {
  const { theme } = useTheme();
  
  return (
    <div className={cn("flex flex-col gap-1 relative", className || "w-full")}>
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
        <select
          {...props}
          className={cn(
            "w-full appearance-none border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none transition-all",
            theme === "light"
              ? "bg-white border-neutral-300 text-neutral-900"
              : "bg-neutral-800 border-neutral-700 text-white",
            error && "border-error"
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
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
