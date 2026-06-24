import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CheckCircle2, Shield, Camera, Inbox, ArrowRight, Clock, Bot, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IssueCard } from '@/components/ui/IssueCard';
import type { Issue } from '@/types/issue';
import { subscribeToRecentIssues } from '@/lib/issues';

export default function HomePage() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || 'Citizen';
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToRecentIssues((issues) => {
      setRecentIssues(issues);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const metrics = useMemo(() => {
    const total = recentIssues.length;
    const resolved = recentIssues.filter(i => i.status === 'resolved').length;
    const aiAnalyzed = recentIssues.filter(i => i.aiProcessed).length;
    const communityVerified = recentIssues.filter(i => i.verificationStatus === 'community_verified').length;
    const highPriority = recentIssues.filter(i => i.aiSeverity === 'critical' || i.aiSeverity === 'high').length;
    const avgScore = total > 0
      ? Math.round(recentIssues.reduce((sum, i) => sum + (i.communityScore ?? 0), 0) / total)
      : 0;

    return { total, resolved, aiAnalyzed, communityVerified, highPriority, avgScore };
  }, [recentIssues]);

  const stats = [
    {
      label: 'Total Issues',
      value: metrics.total.toString(),
      icon: Activity,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      color: '#3b82f6',
    },
    {
      label: 'Resolved',
      value: metrics.resolved.toString(),
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-green-500',
      bg: 'bg-emerald-500/10',
      color: '#10b981',
    },
    {
      label: 'AI Analyzed',
      value: metrics.aiAnalyzed.toString(),
      icon: Bot,
      gradient: 'from-indigo-500 to-purple-500',
      bg: 'bg-indigo-500/10',
      color: '#6366f1',
    },
    {
      label: 'Avg Trust',
      value: metrics.avgScore >= 0 ? `+${metrics.avgScore}` : `${metrics.avgScore}`,
      icon: Shield,
      gradient: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-500/10',
      color: '#8b5cf6',
    },
  ];

  const impactStats = [
    { label: 'Community Verified', value: metrics.communityVerified, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'High / Critical', value: metrics.highPriority, icon: Clock, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-6 py-4">
      {/* Greeting */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {getGreeting()}, {firstName}! 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Report and track civic issues in your community
        </p>
      </div>

      {/* Primary stats — 4 cols */}
      <div
        className="grid grid-cols-2 gap-3 animate-fade-in sm:grid-cols-4"
        style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        {stats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden border-0 shadow-md">
            <CardContent className="p-3 md:p-4">
              <div className={`mb-2 inline-flex rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold md:text-3xl">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight md:text-xs">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary impact row */}
      <div
        className="grid grid-cols-2 gap-3 animate-fade-in"
        style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
      >
        {impactStats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-3 md:p-4 flex items-center gap-3">
                <div className={`inline-flex rounded-lg p-2 shrink-0 ${s.bg}`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Report CTA */}
      <div
        className="animate-fade-in"
        style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
      >
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-lg shadow-indigo-500/20">
          <CardContent className="relative p-5 md:flex md:items-center md:justify-between md:p-7">
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
            <div className="absolute -right-2 bottom-0 h-20 w-20 rounded-full bg-white/5" />
            <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-white/5 hidden md:block" />
            <div className="relative md:flex md:items-center md:gap-5">
              <div className="mb-3 inline-flex rounded-xl bg-white/20 p-2.5 backdrop-blur-sm md:mb-0 md:shrink-0">
                <Camera className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold md:text-xl">Report a Civic Issue</h3>
                <p className="mt-1 text-sm text-indigo-100 md:text-base">
                  Help improve your community — snap, locate, report in under 2 minutes.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="relative mt-4 bg-white text-indigo-700 hover:bg-white/90 shadow-md transition-transform active:scale-95 md:mt-0 md:ml-6 md:shrink-0"
              size="sm"
            >
              <Link to="/report">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Issues */}
      <div
        className="animate-fade-in"
        style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold md:text-xl">Recent Issues</h2>
          <Link to="/my-issues" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-48 rounded-xl bg-muted animate-pulse" />
            <div className="h-48 rounded-xl bg-muted animate-pulse hidden sm:block" />
            <div className="h-48 rounded-xl bg-muted animate-pulse hidden lg:block" />
          </div>
        ) : recentIssues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-muted-foreground">No issues reported yet</h3>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Be the first to report an issue in your area!
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/report">Report Now</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
