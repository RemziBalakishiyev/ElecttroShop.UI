import React from "react";
import { cn } from "../../utils/cn";

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
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <input
        {...props}
        className={cn(
          "border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all",
          error && "border-error",
          className
        )}
      />

      {error && <p className="text-xs text-error mt-0.5">{error}</p>}
    </div>
  );
};
