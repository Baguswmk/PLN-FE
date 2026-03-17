import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/utils.js";
import { LayoutDashboard, Truck, Inbox, Settings } from "lucide-react";
import { useAuthContext } from "@/modules/auth/components/AuthProvider.jsx";

export default function Sidebar({ isOpen, setIsOpen }) {
  const { role } = useAuthContext();
  const location = useLocation();

  const navItems = [
    { name: "Overview", path: "/overview", icon: LayoutDashboard },
    { name: "Pengeluaran ROM", path: "/pengeluaran-rom", icon: Truck },
    { name: "Penerimaan SDJ", path: "/penerimaan-sdj", icon: Inbox },
    {
      name: "Master Data",
      path: "/master-data",
      icon: Settings,
      hide: !["admin", "manager"].includes(role), // Role-based hiding
    },
  ];

  return (
    <aside
      className={cn(
        `absolute z-30 flex flex-col w-64 h-screen px-4 py-8 overflow-y-auto bg-card border-r border-border transition-transform duration-300 ease-in-out lg:static lg:translate-x-0`,
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center justify-between mb-8">
        <a href="/" className="flex flex-col">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            PLN Coal Management
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            Terminal ROM / SDJ
          </span>
        </a>
        <button
          className="lg:hidden text-foreground hover:text-primary transition"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
      </div>

      <nav className="flex flex-col flex-1 space-y-2">
        {navItems.map((item) => {
          if (item.hide) return null;

          const isActive = location.pathname.startsWith(item.path);
          const IconComponent = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
                isActive
                  ? "bg-primary/10 text-primary border-r-4 border-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              onClick={() => setIsOpen(false)} // mobile click close
            >
              <IconComponent
                className={cn(
                  "w-5 h-5 mr-4",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Info */}
      <div className="mt-8 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>v1.0.0</span>
          <span>Offline Ready ⚡</span>
        </div>
      </div>
    </aside>
  );
}
