import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { ReactNode } from "react";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={cn(
      "flex h-[100dvh] transition-colors duration-300",
      theme === "light" ? "bg-neutral-50" : "bg-neutral-950"
    )}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className={cn(
          "flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 transition-colors duration-300",
          theme === "light" ? "bg-neutral-50" : "bg-neutral-950"
        )}>{children}</main>
      </div>
    </div>
  );
};
