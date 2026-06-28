import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Loader2, AwardIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { subscribeToAllIssues } from '@/lib/issues';

interface LeaderEntry {
  name: string;
  score: number;
  issues: number;
}

const rankConfigs = [
  { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  { icon: Award, color: 'text-amber-700', bg: 'bg-amber-700/10' },
];

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to issues to compute real-time leaderboard
    const unsubscribe = subscribeToAllIssues((issues) => {
      const reporterMap: Record<string, { name: string; score: number; issues: number }> = {};
      
      issues.forEach((issue) => {
        const repId = issue.reporterId || 'anonymous';
        const repName = issue.reporterName || 'Anonymous Citizen';
        const cScore = issue.communityScore ?? 0;

        if (!reporterMap[repId]) {
          reporterMap[repId] = {
            name: repName,
            score: 50, // Base trust score
            issues: 0,
          };
        }
        reporterMap[repId].issues += 1;
        // Increase score based on community feedback (scaled)
        reporterMap[repId].score += cScore * 2;
      });

      // Convert, clamp scores between 10 and 100, and sort
      const sorted = Object.values(reporterMap)
        .map(reporter => ({
          ...reporter,
          score: Math.max(10, Math.min(100, reporter.score))
        }))
        .sort((a, b) => b.score - a.score || b.issues - a.issues)
        .slice(0, 5);

      setLeaders(sorted);
      setLoading(false);
    }, 100);

    return () => unsubscribe();
  }, []);

  return (
    <div className="py-4 animate-fade-in">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 p-5">
          <Trophy className="h-10 w-10 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold">Community Heroes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Top reporters making a difference
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Calculating rankings…</span>
        </div>
      ) : leaders.length > 0 ? (
        <div className="space-y-3">
          {leaders.map((leader, index) => {
            const rank = index + 1;
            const config = rankConfigs[index] || { icon: AwardIcon, color: 'text-muted-foreground', bg: 'bg-muted' };
            const IconComponent = config.icon;

            return (
              <Card
                key={leader.name + index}
                className="overflow-hidden transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${rank * 0.05}s`, animationFillMode: 'both' }}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Rank badge */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                    {rank <= 3 ? (
                      <IconComponent className={`h-4 w-4 ${config.color}`} />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {leader.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name & issues */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm">{leader.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {leader.issues} {leader.issues === 1 ? 'issue' : 'issues'} reported
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <Badge variant="secondary" className="shrink-0 font-semibold text-xs py-1">
                      {leader.score} Trust
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Trophy className="h-8 w-8 mb-2" />
            <p className="text-sm">No community rankings computed yet.</p>
          </CardContent>
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Report issues and get upvotes to climb the leaderboard!
      </p>
    </div>
  );
}
