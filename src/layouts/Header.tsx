import { Bell, Search, ChevronDown, LogOut } from "lucide-react";
import { useAuthContext } from "../core/context/AuthContext";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  return (
    <header className="h-16 flex items-center justify-between border-b border-neutral-200 bg-white px-6">
      {/* Right: Search + Notification + Profile */}
      <div className="flex items-center gap-4 ml-auto">
        <div className="relative">
          <Search
            size={18}
            className="absolute top-2.5 left-3 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none transition-all"
          />
        </div>

        <button className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors">
          <Bell size={20} className="text-neutral-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-neutral-200">
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="profile"
            className="w-9 h-9 rounded-full border-2 border-primary-200"
          />
          <div className="text-sm">
            <p className="font-semibold text-neutral-900">
              {user?.fullName || "User"}
            </p>
            <p className="text-neutral-500 text-xs">
              {user?.role === 1 ? "Admin" : "Agent"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            title="Logout"
          >
            <LogOut size={16} className="text-neutral-600" />
          </button>
        </div>
      </div>
    </header>
  );
};
