import { cn } from "./cn";

export const getThemeClasses = (theme: "light" | "dark") => ({
  bg: {
    card: theme === "light" ? "bg-white" : "bg-neutral-800",
    page: theme === "light" ? "bg-neutral-50" : "bg-neutral-950",
  },
  text: {
    primary: theme === "light" ? "text-neutral-900" : "text-white",
    secondary: theme === "light" ? "text-neutral-600" : "text-neutral-400",
    muted: theme === "light" ? "text-neutral-500" : "text-neutral-500",
  },
  border: {
    default: theme === "light" ? "border-neutral-200" : "border-neutral-700",
    input: theme === "light" ? "border-neutral-300" : "border-neutral-700",
  },
  input: cn(
    "border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none transition-all",
    theme === "light"
      ? "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
      : "border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
  ),
});


