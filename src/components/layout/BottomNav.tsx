import { NavLink } from "react-router-dom";
import {
  Home,
  MapPin,
  PlusCircle,
  ClipboardList,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
  label: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/map", icon: MapPin, label: "Map" },
  { to: "/report", icon: PlusCircle, label: "Report", isCenter: true },
  { to: "/my-issues", icon: ClipboardList, label: "My Issues" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "group flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors py-1 flex-1",
                isActive && !item.isCenter
                  ? "text-primary"
                  : !item.isCenter
                    ? "text-muted-foreground hover:text-foreground"
                    : ""
              )
            }
          >
            {({ isActive }) =>
              item.isCenter ? (
                <>
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md transition-transform active:scale-95",
                      "animate-pulse-glow"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </>
              ) : (
                <>
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )
            }
          </NavLink>
        ))}
      </div>

      {/* Safe area spacer for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
