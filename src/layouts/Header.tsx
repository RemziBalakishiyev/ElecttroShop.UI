import { Bell, Search, LogOut, Menu } from "lucide-react";
import { useAuthContext } from "../core/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  return (
    <header className={cn(
      "h-16 flex items-center justify-between border-b px-4 sm:px-6 gap-3 transition-colors duration-300",
      theme === "light"
        ? "border-neutral-200 bg-white"
        : "border-neutral-800 bg-neutral-900"
    )}>
      {/* Left: mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className={cn(
          "lg:hidden p-2 rounded-lg transition-colors shrink-0",
          theme === "light" ? "text-neutral-600 hover:bg-neutral-100" : "text-neutral-300 hover:bg-neutral-800"
        )}
        aria-label={t('sidebar.inventory')}
      >
        <Menu size={22} />
      </button>

      {/* Right: Search + Notification + Profile */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto min-w-0">
        <div className="relative hidden md:block">
          <Search
            size={18}
            className={cn(
              "absolute top-2.5 left-3",
              theme === "light" ? "text-neutral-400" : "text-neutral-500"
            )}
          />
          <input
            type="text"
            placeholder={t('header.search_placeholder')}
            className={cn(
              "pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none transition-all",
              theme === "light"
                ? "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                : "border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
            )}
          />
        </div>

        <button className={cn(
          "relative p-2 rounded-full transition-colors shrink-0",
          theme === "light"
            ? "hover:bg-neutral-100"
            : "hover:bg-neutral-800"
        )}>
          <Bell size={20} className={theme === "light" ? "text-neutral-600" : "text-neutral-400"} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        </button>

        <div className={cn(
          "flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l min-w-0",
          theme === "light" ? "border-neutral-200" : "border-neutral-800"
        )}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <span className="text-sm font-semibold text-white select-none">
              {user?.fullName
                ? user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                : "U"}
            </span>
          </div>
          <div className="text-sm hidden sm:block min-w-0">
            <p className={cn(
              "font-semibold leading-tight truncate",
              theme === "light" ? "text-neutral-900" : "text-white"
            )}>
              {user?.fullName || "User"}
            </p>
            <p className={cn(
              "text-xs truncate",
              theme === "light" ? "text-neutral-500" : "text-neutral-400"
            )}>
              {user?.role === 1 ? t('roles.admin') : t('roles.agent')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "p-2 rounded-full transition-colors shrink-0",
              theme === "light"
                ? "hover:bg-neutral-100"
                : "hover:bg-neutral-800"
            )}
            title={t('header.logout')}
          >
            <LogOut size={16} className={theme === "light" ? "text-neutral-600" : "text-neutral-400"} />
          </button>
        </div>
      </div>
    </header>
  );
};
