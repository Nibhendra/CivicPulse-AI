import { NavLink, Link } from "react-router-dom";
import {
  Home,
  MapPin,
  PlusCircle,
  ClipboardList,
  User,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarNavItem {
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
  label: string;
  dividerBefore?: boolean;
}

const navItems: SidebarNavItem[] = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/map", icon: MapPin, label: "Map Explorer" },
  { to: "/my-issues", icon: ClipboardList, label: "My Issues" },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function DesktopSidebar() {
  const { user } = useAuth();

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : "?";

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 w-64 flex-col border-r bg-background/95 backdrop-blur-lg">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b shrink-0">
        <div className="flex h-9 w-9 items-center justify-center shrink-0">
          <img src="/logo.png" alt="CivicPulse AI" className="h-full w-full object-contain" />
        </div>
        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-lg font-bold tracking-tight text-transparent">
          CivicPulse AI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              {item.dividerBefore && (
                <div className="my-3 border-t border-border/60 mx-2" />
              )}
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0",
                        isActive ? "text-primary" : ""
                      )}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>


        {/* Report CTA in sidebar */}
        <div className="mt-6 px-3">
          <Link
            to="/report"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            Report an Issue
          </Link>
        </div>
      </nav>

      {/* User profile strip at bottom */}
      {user && (
        <div className="border-t px-4 py-4 shrink-0">
          <Link to="/profile" className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted">
            <Avatar className="h-8 w-8 border-2 border-primary/20 shrink-0">
              <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">
                {user.displayName || "Citizen"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground leading-tight">
                {user.email}
              </p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
