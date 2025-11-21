import React from "react";
import { cn } from "../../utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  loading,
  icon,
  className,
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary-400 text-white hover:bg-primary-500 focus:ring-primary-300",
    secondary:
      "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus:ring-neutral-300",
    outline:
      "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-400",
    danger: "bg-error text-white hover:bg-red-600 focus:ring-red-400",
  };

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(baseStyle, variants[variant], className)}
    >
      {loading ? (
        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        <>
          {icon && <span className="text-lg">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
