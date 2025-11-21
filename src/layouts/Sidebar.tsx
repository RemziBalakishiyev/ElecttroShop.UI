import {
  LayoutDashboard,
  ShoppingBag,
  Wrench,
  Settings,
  Briefcase,
  Box,
  Hand,
  FileText,
  Sun,
  Moon,
} from "lucide-react";
import React, { useState } from "react";
import { cn } from "../utils/cn";

const menuItems = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Items", icon: <ShoppingBag size={18} /> },
  { label: "Tools", icon: <Wrench size={18} /> },
  { label: "Assets", icon: <Settings size={18} /> },
  { label: "Project", icon: <Briefcase size={18} /> },
  { label: "Request", icon: <Box size={18} /> },
  { label: "On hand", icon: <Hand size={18} /> },
  { label: "GRN Report", icon: <FileText size={18} /> },
];

export const Sidebar = () => {
  const [active, setActive] = useState("Items");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <aside
      className={cn(
        "flex flex-col justify-between w-64 h-screen border-r transition-colors duration-300",
        theme === "light"
          ? "bg-background-sidebar border-primary-100"
          : "bg-neutral-900 border-neutral-800"
      )}
    >
      {/* Top section */}
      <div>
        <div className="p-6 flex items-center gap-3 font-bold text-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
            <Box size={18} className="text-white" />
          </div>
          <span className="text-neutral-900">Inventory</span>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActive(item.label)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active === item.label
                  ? "bg-primary-400 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-primary-50 hover:text-primary-600"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Theme switcher */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            theme === "light"
              ? "bg-primary-400 text-white"
              : "bg-white text-neutral-700"
          )}
        >
          <Sun size={16} /> Light
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            theme === "dark"
              ? "bg-primary-400 text-white"
              : "bg-white text-neutral-700"
          )}
        >
          <Moon size={16} /> Dark
        </button>
      </div>
    </aside>
  );
};
