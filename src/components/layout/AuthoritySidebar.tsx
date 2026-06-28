import { NavLink } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface SidebarNavItem {
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
  label: string;
}

const navItems: SidebarNavItem[] = [
  { to: "/authority", icon: LayoutDashboard, label: "Case Queue" },
];

export default function AuthoritySidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 w-64 flex-col border-r bg-background/95 backdrop-blur-lg">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b shrink-0 bg-slate-50">
        <div className="flex h-9 w-9 items-center justify-center shrink-0">
          <img src="/logo.png" alt="CivicPulse AI" className="h-full w-full object-contain" />
        </div>
        <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-lg font-bold tracking-tight text-transparent">
          Civic Operations
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Authority Controls
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/authority"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-200"
                      : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0",
                        isActive ? "text-slate-900" : ""
                      )}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User profile strip at bottom */}
      <div className="border-t px-4 py-4 shrink-0 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 font-bold text-xs shrink-0">
              AO
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-slate-900">
                Authority Officer
              </p>
              <p className="truncate text-[11px] text-muted-foreground leading-tight">
                {user?.email || "Admin Account"}
              </p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="text-muted-foreground hover:text-red-600 transition-colors p-2"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
