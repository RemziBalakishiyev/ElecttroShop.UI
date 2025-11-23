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
  
  return (
    <div className={cn(
      "flex h-screen transition-colors duration-300",
      theme === "light" ? "bg-neutral-50" : "bg-neutral-950"
    )}>
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className={cn(
          "flex-1 overflow-y-auto p-6 transition-colors duration-300",
          theme === "light" ? "bg-neutral-50" : "bg-neutral-950"
        )}>{children}</main>
      </div>
    </div>
  );
};
