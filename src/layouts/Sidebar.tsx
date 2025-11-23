import {
  LayoutDashboard,
  ShoppingBag,
  Sun,
  Moon,
  FolderTree,
  Tag,
  Percent,
  Box,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "../utils/cn";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";

export const Sidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const menuItems = [
    { label: t('sidebar.dashboard'), icon: <LayoutDashboard size={18} />, path: "/" },
    { label: t('sidebar.items'), icon: <ShoppingBag size={18} />, path: "/products" },
    { label: t('sidebar.categories'), icon: <FolderTree size={18} />, path: "/categories" },
    { label: t('sidebar.brands'), icon: <Tag size={18} />, path: "/brands" },
    { label: t('sidebar.discounts'), icon: <Percent size={18} />, path: "/discounts" },
  ];

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
          <span className={cn(
            theme === "light" ? "text-neutral-900" : "text-white"
          )}>{t('sidebar.inventory')}</span>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path} // Changed key to path since label is dynamic
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary-400 text-white shadow-sm"
                    : theme === "light"
                    ? "text-neutral-600 hover:bg-primary-50 hover:text-primary-600"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Theme switcher */}
      <div className={cn(
        "p-4 flex items-center justify-between border-t",
        theme === "light" ? "border-primary-100" : "border-neutral-800"
      )}>
        <button
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            theme === "light"
              ? "bg-primary-400 text-white"
              : theme === "dark"
              ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              : "bg-white text-neutral-700"
          )}
        >
          <Sun size={16} /> {t('sidebar.light')}
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            theme === "dark"
              ? "bg-primary-400 text-white"
              : theme === "light"
              ? "bg-white text-neutral-700 hover:bg-neutral-50"
              : "bg-white text-neutral-700"
          )}
        >
          <Moon size={16} /> {t('sidebar.dark')}
        </button>
      </div>
    </aside>
  );
};
