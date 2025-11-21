import React from "react";
import { ChevronDown } from "lucide-react";

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
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full relative">
      {label && (
        <label className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          {...props}
          className={`w-full appearance-none border rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white border-neutral-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none transition-all ${
            error ? "border-error" : ""
          }`}
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
          className="absolute right-3 top-3 text-neutral-400 pointer-events-none"
        />
      </div>
      {error && <p className="text-xs text-error mt-0.5">{error}</p>}
    </div>
  );
};
