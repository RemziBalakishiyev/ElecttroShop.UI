import React from "react";
import { cn } from "../../utils/cn";

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
  return (
    <label className={cn("flex items-center gap-2 cursor-pointer group", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400 focus:ring-2 cursor-pointer"
      />
      <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
        {label}
      </span>
    </label>
  );
};



