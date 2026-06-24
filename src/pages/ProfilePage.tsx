import { useNavigate } from 'react-router-dom';
import { Shield, FileText, CheckCircle, ThumbsUp, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const stats = [
    { label: 'Reported', value: 0, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Resolved', value: 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Upvotes', value: 0, icon: ThumbsUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="py-4 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account and activity overview</p>
      </div>

      {/*
        Mobile: single-column stack
        Desktop (lg+): two-column grid — left: profile + trust, right: stats + settings
      */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-8">

        {/* LEFT column — profile banner + trust score */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile header card */}
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600" />
            <CardContent className="relative px-6 pb-6">
              <Avatar className="-mt-12 h-24 w-24 border-4 border-background shadow-lg">
                {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || ''} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="mt-3">
                <h2 className="text-xl font-bold">{user?.displayName || 'Citizen'}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Trust Score */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Trust Score</span>
                </div>
                <span className="text-2xl font-bold text-primary">50</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: '50%' }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Report accurate issues and receive upvotes to increase your trust score.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT column — stats + actions */}
        <div className="mt-4 lg:col-span-3 lg:mt-0 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <div className={`mb-2 inline-flex rounded-lg p-2 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{stat.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Account settings card */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Account
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Display Name</span>
                  <span className="font-medium">{user?.displayName || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium truncate max-w-[180px]">{user?.email || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium">
                    {user?.metadata.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-2" />

          {/* Logout */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
