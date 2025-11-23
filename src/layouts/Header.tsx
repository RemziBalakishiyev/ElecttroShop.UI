import { Bell, Search, LogOut } from "lucide-react";
import { useAuthContext } from "../core/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

export const Header = () => {
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
      "h-16 flex items-center justify-between border-b px-6 transition-colors duration-300",
      theme === "light"
        ? "border-neutral-200 bg-white"
        : "border-neutral-800 bg-neutral-900"
    )}>
      {/* Right: Search + Notification + Profile */}
      <div className="flex items-center gap-4 ml-auto">
        <div className="relative">
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
          "relative p-2 rounded-full transition-colors",
          theme === "light"
            ? "hover:bg-neutral-100"
            : "hover:bg-neutral-800"
        )}>
          <Bell size={20} className={theme === "light" ? "text-neutral-600" : "text-neutral-400"} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        </button>

        <div className={cn(
          "flex items-center gap-3 pl-3 border-l",
          theme === "light" ? "border-neutral-200" : "border-neutral-800"
        )}>
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="profile"
            className="w-9 h-9 rounded-full border-2 border-primary-200"
          />
          <div className="text-sm">
            <p className={cn(
              "font-semibold",
              theme === "light" ? "text-neutral-900" : "text-white"
            )}>
              {user?.fullName || "User"}
            </p>
            <p className={theme === "light" ? "text-neutral-500" : "text-neutral-400"}>
              {user?.role === 1 ? t('roles.admin') : t('roles.agent')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "p-2 rounded-full transition-colors",
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
