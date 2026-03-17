import React, { useState, useEffect } from "react";
import {
  Menu,
  Wifi,
  WifiOff,
  Bell,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";
import { useAuthContext } from "@/modules/auth/components/AuthProvider.jsx";
import {
  getNetworkStatus,
  subscribe,
  unsubscribe,
} from "@/core/offline/networkDetector.js";
import { useTheme } from "@/shared/components/ui/theme-provider.jsx";
import { forceRefreshApp } from "@/core/pwa/refreshApp.js";

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { user, role, logout } = useAuthContext();
  const [isOnline, setIsOnline] = useState(getNetworkStatus());
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    const id = "header_network";
    subscribe(id, setIsOnline);
    return () => unsubscribe(id);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border shadow-sm sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden lg:flex flex-col">
          <h2 className="text-xl font-bold tracking-tight">Tracker</h2>
          <p className="text-xs text-muted-foreground">
            Otomatisasi & Sinkronisasi Data
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Network Status indicator */}
        <div
          title={
            isOnline ? "Online - Tersambung ke Server" : "Offline - Mode Lokal"
          }
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-colors duration-300 ${isOnline ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-destructive/10 text-destructive animate-pulse"}`}
        >
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isOnline ? "Online" : "Offline Mode"}
          </span>
        </div>

        {/* Force Refresh Button */}
        <button
          onClick={forceRefreshApp}
          title="Force Refresh Aplikasi"
          className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle Dark Mode"
          className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* User Menu Trigger */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 hover:bg-muted p-1.5 pr-4 rounded-full border border-transparent hover:border-border transition-all group"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold text-foreground leading-none mb-1">
                {user?.username || "User"}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider leading-none">
                {role || "Guest"}
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border shadow-xl rounded-lg py-1 z-50 animate-fade-in origin-top-right">
              <div className="px-4 py-3 border-b border-border sm:hidden">
                <p className="text-sm font-semibold">{user?.username}</p>
                <p className="text-xs text-muted-foreground uppercase">
                  {role}
                </p>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 flex items-center transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
