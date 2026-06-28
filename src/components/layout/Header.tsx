import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { isAuthorityUser } from "@/lib/roles";
import { LogOut } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const isAuthUser = isAuthorityUser(user);

  const initials = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : "?";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-lg lg:hidden">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center shrink-0">
          <img src="/logo.png" alt="CivicPulse AI" className="h-full w-full object-contain" />
        </div>
        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-lg font-bold tracking-tight text-transparent">
          CivicPulse AI
        </span>
      </div>

      {/* User avatar and logout */}
      {user && (
        <div className="flex items-center gap-4">
          {isAuthUser && (
            <button 
              onClick={logout} 
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
          <Avatar className="h-8 w-8 border-2 border-primary/20">
            <AvatarImage
              src={user.photoURL ?? undefined}
              alt={user.displayName ?? "User"}
            />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </header>
  );
}
