import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/utils.js";
import {
  LayoutDashboard,
  Truck,
  Inbox,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { useAuthContext } from "@/modules/auth/components/AuthProvider.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";

export default function Sidebar({
  isOpen,
  setIsOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
}) {
  const { role, logout } = useAuthContext();
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
        `absolute z-30 flex flex-col h-screen px-4 py-8 overflow-y-auto overflow-x-hidden bg-card border-r border-border  lg:static lg:translate-x-0`,
        isOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "lg:w-20 w-64" : "w-64",
      )}
    >
      <div className="flex items-center mb-8 relative h-10 w-full">
        <a href="/" className="flex items-center w-full h-full">
           <div className={cn("absolute left-0 flex flex-col whitespace-nowrap  origin-left", sidebarCollapsed ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100")}>
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 leading-none">
               PLN Coal Management
             </span>
             <span className="text-xs text-muted-foreground mt-1 leading-none">
               Terminal ROM / SDJ
             </span>
           </div>
           
           <div className={cn("absolute left-1/2 -translate-x-1/2  origin-center", sidebarCollapsed ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none")}>
             <span className="text-xl font-bold text-primary">PLN</span>
           </div>
        </a>

        <button
          className={cn(
            "lg:hidden absolute right-0 text-foreground hover:text-primary transition-all duration-300",
            sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
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
              title={sidebarCollapsed ? item.name : undefined}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                sidebarCollapsed && "justify-center px-2",
                isActive
                  ? "bg-primary/10 text-primary border-r-4 border-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              onClick={() => setIsOpen(false)} // mobile click close
            >
              <IconComponent
                className={cn(
                  "w-5 h-5 shrink-0 transition-all duration-300",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "whitespace-nowrap overflow-hidden ",
                  sidebarCollapsed ? "w-0 opacity-0 ml-0" : "w-40 opacity-100 ml-4"
                )}
              >
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-border">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            "hidden lg:flex items-center px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-all duration-300 overflow-hidden",
            sidebarCollapsed && "justify-center px-2"
          )}
          title={sidebarCollapsed ? "Perbesar Sidebar" : undefined}
        >
          <div className="relative w-5 h-5 shrink-0">
             <PanelLeftOpen className={cn("absolute inset-0 w-5 h-5 transition-all duration-300", sidebarCollapsed ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50")} />
             <PanelLeftClose className={cn("absolute inset-0 w-5 h-5 transition-all duration-300", !sidebarCollapsed ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50")} />
          </div>
          <span className={cn(
            "whitespace-nowrap ",
            sidebarCollapsed ? "w-0 opacity-0 ml-0" : "w-32 opacity-100 ml-0"
          )}>
            Perkecil Sidebar
          </span>
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              title={sidebarCollapsed ? "Keluar" : undefined}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-300 overflow-hidden w-full",
                sidebarCollapsed && "justify-center px-2"
              )}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className={cn(
                "whitespace-nowrap  text-left",
                sidebarCollapsed ? "w-0 opacity-0 ml-0" : "w-32 opacity-100 ml-4"
              )}>
                Keluar
              </span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader className="text-left">
              <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin keluar dari sesi saat ini? Anda harus login kembali untuk mengakses sistem.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={logout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Ya, Keluar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}
