import { Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user } = useAuth();

  const initials = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : "?";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-lg lg:hidden">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20">
          <Shield className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-lg font-bold tracking-tight text-transparent">
          CivicPulse AI
        </span>
      </div>

      {/* User avatar */}
      {user && (
        <Avatar className="h-8 w-8 border-2 border-primary/20">
          <AvatarImage
            src={user.photoURL ?? undefined}
            alt={user.displayName ?? "User"}
          />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
    </header>
  );
}
