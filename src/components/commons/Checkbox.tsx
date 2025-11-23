import React from "react";
import { cn } from "../../utils/cn";
import { useTheme } from "../../core/context/ThemeContext";

interface CheckboxProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  className,
}) => {
  const { theme } = useTheme();
  
  return (
    <label className={cn("flex items-center gap-2 cursor-pointer group", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className={cn(
          "w-4 h-4 rounded text-primary-500 focus:ring-primary-400 focus:ring-2 cursor-pointer",
          theme === "light" ? "border-neutral-300" : "border-neutral-600"
        )}
      />
      <span className={cn(
        "text-sm",
        theme === "light"
          ? "text-neutral-700 group-hover:text-neutral-900"
          : "text-neutral-300 group-hover:text-white"
      )}>
        {label}
      </span>
    </label>
  );
};



